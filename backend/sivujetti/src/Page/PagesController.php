<?php declare(strict_types=1);

namespace Sivujetti\Page;

use MySite\Theme;
use Pike\{AppConfig, ArrayUtils, Db, PikeException, Request, Response};
use Sivujetti\Page\Entities\Page;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\{App, SharedAPIContext, Template, Translator};
use Sivujetti\Block\Entities\Block;
use Sivujetti\TheWebsite\Entities\TheWebsite;
use Sivujetti\UserTheme\UserThemeAPI;
use Sivujetti\BlockType\Entities\BlockTypes;
use Sivujetti\BlockType\GlobalBlockReferenceBlockType;
use Sivujetti\BlockType\ListeningBlockTypeInterface;
use Sivujetti\Layout\Entities\Layout;
use Sivujetti\Layout\LayoutsRepository;

final class PagesController {
    /**
     * GET /[anything]: Renders a page.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     * @param \Sivujetti\SharedAPIContext $apiCtx
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     */
    public function renderPage(Request $req,
                               Response $res,
                               PagesRepository $pagesRepo,
                               SharedAPIContext $apiCtx,
                               TheWebsite $theWebsite): void {
        $pcs = explode("/", $req->params->url, 3);
        [$pageTypeSlug, $slug] = count($pcs) > 2
            ? [$pcs[1], "/{$pcs[2]}"]
            : [PageType::SLUG_PAGE, "/{$pcs[1]}"];
        if (!($pageType = ArrayUtils::findByKey($theWebsite->pageTypes,
                                                $pageTypeSlug,
                                                "slug"))) {
            $res->status(404)->html("Unknown page type `" . Template::e($pageTypeSlug) . "`.");
            return;
        }
        if (!($page = $pagesRepo->getSingle($pageType, ["slug" => $slug]))) {
            $res->status(404)->html("404");
            return;
        }
        self::sendPageResponse($req, $res, $pagesRepo, $apiCtx, $theWebsite, $page, $pageType);
    }
    /**
     * GET /api/_placeholder-page/[w:pageType]/[i:layoutId]: renders a placeholder
     * page for "Create page" functionality.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     * @param \Sivujetti\Layout\LayoutsRepository $layoutsRepo
     * @param \Sivujetti\SharedAPIContext $apiCtx
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     * @throws \Pike\PikeException
     */
    public function renderPlaceholderPage(Request $req,
                                          Response $res,
                                          PagesRepository $pagesRepo,
                                          LayoutsRepository $layoutsRepo,
                                          SharedAPIContext $apiCtx,
                                          TheWebsite $theWebsite): void {
        $pageType = $pagesRepo->getPageTypeOrThrow($req->params->pageType);
        $page = self::createEmptyPage($pageType);
        foreach ($pageType->ownFields as $field) {
            $page->{$field->name} = $field->defaultValue;
        }
        $layout = $layoutsRepo->findById($req->params->layoutId);
        if (!$layout)
            throw new PikeException("Layout `{$req->params->layoutId}` doesn't exist",
                                    PikeException::BAD_INPUT);
        $page->layoutId = $layout->id;
        $page->layout = $layout;
        self::mergeLayoutBlocksTo($page, $page->layout, $pageType);
        //
        self::sendPageResponse($req, $res, $pagesRepo, $apiCtx, $theWebsite,
            $page, $pageType);
    }
    /**
     * GET /_edit/[**:url]?: Renders the edit app.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     * @param \Sivujetti\SharedAPIContext $apiCtx
     * @param \Pike\AppConfig $config
     * @param \Pike\Db $db
     */
    public function renderEditAppWrapper(Request $req,
                                         Response $res,
                                         TheWebsite $theWebsite,
                                         SharedAPIContext $apiCtx,
                                         AppConfig $config,
                                         Db $db): void {
        $parsed = json_decode($theWebsite->firstRunsJson, flags: JSON_THROW_ON_ERROR);
        $isFirstRun = ($parsed->{$req->myData->user->id} ?? null) !== "y";
        if ($isFirstRun) {
            $parsed->{$req->myData->user->id} = "y";
            // todo theWebsiteRepo->update()->fields(["firstRun"])->exec(json_encode())
            $db->exec("UPDATE `\${p}theWebsite` SET `firstRuns`=?", [json_encode($parsed)]);
        }
        $res->html((new WebPageAwareTemplate("sivujetti:edit-app-wrapper.tmpl.php"))->render([
            "url" => $req->params->url ?? "",
            "userDefinedJsFiles" => $apiCtx->adminJsFiles,
            "dataToFrontend" => json_encode((object) [
                "baseUrl" => WebPageAwareTemplate::makeUrl("/", true),
                "assetBaseUrl" => WebPageAwareTemplate::makeUrl("/", false),
                "pageTypes" => $theWebsite->pageTypes->getArrayCopy(),
                "activeTheme" => (object) ["id" => $theWebsite->activeTheme->id],
                "blockRenderers" => $apiCtx->validBlockRenderers,
                "showGoToDashboardMode" => $config->get("app.showGoToDashboardMode", false),
                "dashboardUrl" => $config->get("app.dashboardUrl", ""),
            ]),
            "uiLang" => "fi",
            "isFirstRun" => $isFirstRun || $req->queryVar("first-run") !== null,
        ]));
    }
    /**
     * GET /jet-login: Renders the login page.
     *
     * @param \Pike\Response $res
     * @param \Pike\AppConfig $config
     */
    public function renderLoginPage(Response $res, AppConfig $config): void {
        $res->html((new WebPageAwareTemplate("sivujetti:page-auth-view.tmpl.php"))->render([
            "title" => "Login",
            "appName" => "login",
            "baseUrl" => WebPageAwareTemplate::makeUrl("/", true),
            "uiLang" => "fi",
            "dashboardUrl" => $config->get("app.dashboardUrl", ""),
        ]));
    }
    /**
     * GET /jet-reset-pass: Renders a password reset request page.
     *
     * @param \Pike\Response $res
     */
    public function renderRequestPassResetPage(Response $res): void {
        $res->html("This feature is currently disabled.");
    }
    /**
     * POST /api/pages/[w:pageType]: Inserts a new page to the database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     */
    public function createPage(Request $req,
                               Response $res,
                               PagesRepository $pagesRepo): void {
        $pageType = $pagesRepo->getPageTypeOrThrow($req->params->pageType);
        //
        $num = $pagesRepo->insert($pageType, $req->body);
        //
        if ($num !== 1)
            throw new PikeException("Expected \$numAffectedRows to equal 1 but got $num",
                PikeException::INEFFECTUAL_DB_OP);
        //
        $res->status(201)->json(["ok" => "ok"]);
    }
    /**
     * PUT /api/pages/[w:pageType]/[i:pageId]/blocks: Overwrites the block tree
     * of $req->params->pageId to the database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     */
    public function updatePageBlocks(Request $req,
                                     Response $res,
                                     PagesRepository $pagesRepo): void {
        $pageType = $pagesRepo->getPageTypeOrThrow($req->params->pageType);
        //
        $pseudoPage = new \stdClass;
        $pseudoPage->type = $req->params->pageType;
        $pseudoPage->blocks = $req->body->blocks;
        $num = $pagesRepo->updateById($pageType,
                                      $req->params->pageId,
                                      $pseudoPage,
                                      theseColumnsOnly: ["blocks"]);
        //
        if ($num !== 1)
            throw new PikeException("Expected \$numAffectedRows to equal 1 but got $num",
                PikeException::INEFFECTUAL_DB_OP);
        //
        $res->status(200)->json(["ok" => "ok"]);
    }
    /**
     * PUT /api/pages/[w:pageType]/[i:pageId]: updates basic info of $req->params
     * ->pageId to the database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     */
    public function updatePage(Request $req,
                               Response $res,
                               PagesRepository $pagesRepo): void {
        $pageType = $pagesRepo->getPageTypeOrThrow($req->params->pageType);
        //
        $num = $pagesRepo->updateById($pageType, $req->params->pageId, $req->body);
        //
        if ($num !== 1)
            throw new PikeException("Expected \$numAffectedRows to equal 1 but got $num",
                PikeException::INEFFECTUAL_DB_OP);
        //
        $res->status(200)->json(["ok" => "ok"]);
    }
    /**
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     * @param \Sivujetti\SharedAPIContext $apiCtx
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     * @param \Sivujetti\Page\Entities\Page $page
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     * @throws \Pike\PikeException
     */
    private static function sendPageResponse(Request $req,
                                             Response $res,
                                             PagesRepository $pagesRepo,
                                             SharedAPIContext $apiCtx,
                                             TheWebsite $theWebsite,
                                             Page $page,
                                             PageType $pageType) {
        $themeAPI = new UserThemeAPI("theme", $apiCtx, new Translator);
        $_ = new Theme($themeAPI); // Note: mutates $apiCtx->userDefinesAssets|etc
        $isPlaceholderPage = $page->id === "-";
        //
        self::runBlockBeforeRenderEvent($page->blocks, $apiCtx->blockTypes, $pagesRepo, $theWebsite);
        $apiCtx->triggerEvent($themeAPI::ON_PAGE_BEFORE_RENDER, $page);
        $html = (new WebPageAwareTemplate(
            $page->layout->relFilePath,
            cssAndJsFiles: $apiCtx->userDefinedAssets,
            theme: $theWebsite->activeTheme,
            blockStyles: $page->blockStyles
        ))->render([
            "currentPage" => $page,
            "currentUrl" => $req->path,
            "site" => $theWebsite,
        ]);
        if (($isPlaceholderPage || $req->queryVar("in-edit") !== null) &&
            ($bodyEnd = strrpos($html, "</body>")) > 0) {
            $html = substr($html, 0, $bodyEnd) .
                "<script>window.sivujettiCurrentPageData = " . json_encode([
                    "page" => self::pageToRaw($page, $pageType, $isPlaceholderPage),
                    "layout" => self::layoutToRaw($page->layout),
                ]) . "</script>" .
                "<script src=\"" . WebPageAwareTemplate::makeUrl("public/sivujetti/sivujetti-webpage.js", false) . "\"></script>" .
            substr($html, $bodyEnd);
        }
        $res->html($html);
    }
    /**
     * @param \Sivujetti\Block\Entities\Block[] $branch
     * @param \Sivujetti\BlockType\Entities\BlockTypes $blockTypes
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     */
    public static function runBlockBeforeRenderEvent(array $branch,
                                                     BlockTypes $blockTypes,
                                                     PagesRepository $pagesRepo,
                                                     TheWebsite $theWebsite): void {
        foreach ($branch as $block) {
            if ($block->type === "__marker")
                continue;
            $blockType = $blockTypes->{$block->type};
            if (array_key_exists(ListeningBlockTypeInterface::class, class_implements($blockType)))
                $blockType->onBeforeRender($block, $blockType, App::$di);
            if ($block->children)
                self::runBlockBeforeRenderEvent($block->children, $blockTypes, $pagesRepo, $theWebsite);
        }
    }
    /**
     * @param \Sivujetti\Page\Entities\Page $toPage
     * @param \Sivujetti\Layout\Entities\Layout $fromLayout
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     */
    private static function mergeLayoutBlocksTo(Page $toPage,
                                                Layout $fromLayout,
                                                PageType $pageType): void {
        foreach ($fromLayout->structure as $part) {
            if ($part->type === Layout::PART_TYPE_GLOBAL_BLOCK_TREE)
                $toPage->blocks[] = Block::fromBlueprint((object) [
                    "type" => Block::TYPE_GLOBAL_BLOCK_REF,
                    "title" => "",
                    "defaultRenderer" => "sivujetti:block-auto",
                    "children" => [],
                    "initialData" => (object) [
                        "globalBlockTreeId" => $part->globalBlockTreeId,
                        "overrides" => GlobalBlockReferenceBlockType::EMPTY_OVERRIDES,
                        "useOverrides" => 0,
                    ],
                ]);
            elseif ($part->type === Layout::PART_TYPE_PAGE_CONTENTS)
                array_push($toPage->blocks, ...array_map([Block::class, "fromBlueprint"], array_merge(
                    [(object) [
                        "type" => Block::TYPE_PAGE_INFO,
                        "title" => "",
                        "defaultRenderer" => "sivujetti:block-auto",
                        "children" => [],
                        "initialData" => (object) ["overrides" => "[]"]
                    ]],
                    $pageType->blockFields
                )));
        }
    }
    /**
     * @param \Sivujetti\Page\Entities\Page $page
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     * @param bool $isPlaceholderPage
     * @return object
     */
    private static function pageToRaw(Page $page,
                                      PageType $pageType,
                                      bool $isPlaceholderPage): object {
        $out = (object) [
            "id" => $page->id,
            "slug" => $page->slug,
            "path" => $page->path,
            "level" => $page->level,
            "type" => $page->type,
            "title" => $page->title,
            "layoutId" => $page->layoutId,
            "status" => $page->status,
            "blocks" => $page->blocks,
            "isPlaceholderPage" => $isPlaceholderPage,
        ];
        foreach ($pageType->ownFields as $field) {
            if ($field->name === "categories") { // @todo
                $out->categories = [];
                continue;
            }
            $out->{$field->name} = $page->{$field->name};
        }
        return $out;
    }
    /**
     * @param \Sivujetti\Layout\Entities\Layout $layout
     * @return object
     */
    private static function layoutToRaw(Layout $layout): object {
        return (object) [
            "friendlyName" => $layout->friendlyName,
            "structure" => $layout->structure,
        ];
    }
    /**
     * @param \Sivujetti\PageType\Entities\PageType $pagePageType
     * @return \Sivujetti\Page\Entities\Page
     */
    public static function createEmptyPage(PageType $pagePageType): Page {
        $page = new Page;
        $page->slug = "-";
        $page->path = "-";
        $page->level = 1;
        $page->title = $pagePageType->defaultFields->title->defaultValue;
        $page->id = "-";
        $page->type = $pagePageType->name;
        $page->blocks = [];
        $page->status = Page::STATUS_DRAFT;
        return $page;
    }
}
