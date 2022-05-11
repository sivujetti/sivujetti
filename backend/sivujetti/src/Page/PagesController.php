<?php declare(strict_types=1);

namespace Sivujetti\Page;

use MySite\Theme;
use Pike\{AppConfig, ArrayUtils, Db, PikeException, Request, Response};
use Pike\Db\FluentDb;
use Pike\Interfaces\RowMapperInterface;
use Sivujetti\Page\Entities\Page;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\{App, SharedAPIContext, Template, Translator};
use Sivujetti\Auth\ACL;
use Sivujetti\Block\Entities\Block;
use Sivujetti\TheWebsite\Entities\TheWebsite;
use Sivujetti\UserTheme\UserThemeAPI;
use Sivujetti\BlockType\Entities\BlockTypes;
use Sivujetti\BlockType\{GlobalBlockReferenceBlockType, ListeningBlockTypeInterface};
use Sivujetti\GlobalBlockTree\GlobalBlocksOrPageBlocksUpserter as StylesUpserter;
use Sivujetti\Layout\Entities\Layout;
use Sivujetti\Layout\LayoutsRepository;
use Sivujetti\Theme\ThemeCssFileUpdaterWriter;

final class PagesController {
    /**
     * GET /[anything]: Renders a page.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb $db
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     * @param \Sivujetti\SharedAPIContext $apiCtx
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     */
    public function renderPage(Request $req,
                               Response $res,
                               FluentDb $db,
                               PagesRepository $pagesRepo,
                               SharedAPIContext $apiCtx,
                               TheWebsite $theWebsite): void {
        $pcs = explode("/", $req->params->url, 3);
        [$pageTypeSlug, $slug] = count($pcs) > 2
            ? ["/" . $pcs[1], "/{$pcs[2]}"]
            : ["/" . PageType::SLUG_PAGE, "/{$pcs[1]}"];
        if (!($pageType = ArrayUtils::findByKey($theWebsite->pageTypes,
                                                $pageTypeSlug,
                                                "slug"))) {
            $res->status(404)->html("Unknown page type `" . Template::e($pageTypeSlug) . "`.");
            return;
        }
        if (!($page = $pagesRepo->getSingle($pageType,
                                            $theWebsite->activeTheme->id,
                                            ["filters" => [["slug", $slug]]]))) {
            $res->status(404)->html("404");
            return;
        }
        self::sendPageResponse($req, $res, $db, $pagesRepo, $apiCtx, $theWebsite,
            $page, $pageType);
    }
    /**
     * GET /api/_placeholder-page/[w:pageType]/[i:layoutId]: renders a placeholder
     * page for "Create page" functionality.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb $db
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     * @param \Sivujetti\Layout\LayoutsRepository $layoutsRepo
     * @param \Sivujetti\SharedAPIContext $apiCtx
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     * @throws \Pike\PikeException
     */
    public function renderPlaceholderPage(Request $req,
                                          Response $res,
                                          FluentDb $db,
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
        self::sendPageResponse($req, $res, $db, $pagesRepo, $apiCtx, $theWebsite,
            $page, $pageType);
    }
    /**
     * GET /_edit/[**:url]?: Renders the edit app.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     * @param \Sivujetti\SharedAPIContext $apiCtx
     * @param \Sivujetti\Auth\ACL $acl
     * @param \Pike\AppConfig $config
     * @param \Pike\Db $db
     */
    public function renderEditAppWrapper(Request $req,
                                         Response $res,
                                         TheWebsite $theWebsite,
                                         SharedAPIContext $apiCtx,
                                         ACL $acl,
                                         AppConfig $config,
                                         Db $db): void {
        $parsed = json_decode($theWebsite->firstRunsJson, flags: JSON_THROW_ON_ERROR);
        $isFirstRun = ($parsed->{$req->myData->user->id} ?? null) !== "y";
        if ($isFirstRun) {
            $parsed->{$req->myData->user->id} = "y";
            // todo theWebsiteRepo->update()->fields(["firstRun"])->exec(json_encode())
            $db->exec("UPDATE `\${p}theWebsite` SET `firstRuns`=?", [json_encode($parsed)]);
        }
        $userRole = $req->myData->user->role;
        $res->html((new WebPageAwareTemplate("sivujetti:edit-app-wrapper.tmpl.php"))->render([
            "url" => $req->params->url ?? "",
            "userDefinedJsFiles" => $apiCtx->adminJsFiles,
            "dataToFrontend" => json_encode((object) [
                "baseUrl" => WebPageAwareTemplate::makeUrl("/", true),
                "assetBaseUrl" => WebPageAwareTemplate::makeUrl("/", false),
                "pageTypes" => $theWebsite->pageTypes->getArrayCopy(),
                "activeTheme" => (object) ["id" => $theWebsite->activeTheme->id],
                "blockRenderers" => $apiCtx->blockRenderers,
                "showGoToDashboardMode" => $config->get("app.showGoToDashboardMode", false),
                "dashboardUrl" => $config->get("app.dashboardUrl", ""),
                "userPermissions" => [
                    "canDoAnything" => $userRole === ACL::ROLE_SUPER_ADMIN,
                    "canEditCssStyles" => $acl->can($userRole, "upsertStylesOf", "pages"),
                    "canEditThemeStyles" => $acl->can($userRole, "updateGlobalStylesOf", "themes"),
                    "canCreatePageTypes" => $acl->can($userRole, "create", "pageTypes"),
                    "canCreatePages" => $acl->can($userRole, "create", "pages"),
                    "canSpecializeGlobalBlocks" => $userRole <= ACL::ROLE_ADMIN,
                ],
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
        $res
            ->header("Cache-Control", "no-store, must-revalidate")
            ->html((new WebPageAwareTemplate("sivujetti:page-auth-view.tmpl.php"))->render([
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
        [$numAffectedRows, $errors] = $pagesRepo->insert($pageType, $req->body);
        //
        if ($errors) {
            $res->status(400)->json($errors);
            return;
        }
        if ($numAffectedRows !== 1) throw new PikeException(
            "Expected \$numAffectedRows to equal 1 but got {$numAffectedRows}",
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
        $numAffectedRows = $pagesRepo->updateById($pageType,
                                                  $req->params->pageId,
                                                  $pseudoPage,
                                                  theseColumnsOnly: ["blocks"]);
        //
        if ($numAffectedRows !== 1) throw new PikeException(
            "Expected \$numAffectedRows to equal 1 but got {$numAffectedRows}",
            PikeException::INEFFECTUAL_DB_OP);
        //
        $res->status(200)->json(["ok" => "ok"]);
    }
    /**
     * PUT /api/pages/:pageType/:pageId/block-styles/:themeId: Overwrites the
     * styles of $req->params->pageId's blocks that are linked to
     * $req->params->themeId.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb $db
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     * @param \Sivujetti\Theme\ThemeCssFileUpdaterWriter $cssGen
     */
    public function upsertBlockStyles(Request $req,
                                      Response $res,
                                      FluentDb $db,
                                      PagesRepository $pagesRepo,
                                      ThemeCssFileUpdaterWriter $cssGen): void {
        $pageType = $pagesRepo->getPageTypeOrThrow($req->params->pageType);
        //
        if (($errors = StylesUpserter::validateInput($req->body))) {
            $res->status(400)->json($errors);
            return;
        }
        //
        [$result, $error, $stylesExistedAlready] = StylesUpserter::upsertStyles($req, $db,
            "pageBlocksStyles", $cssGen, $pageType);
        //
        if ($error)
            throw new PikeException($error, PikeException::ERROR_EXCEPTION);
        if ($stylesExistedAlready)
            $res->status(200)->json(["ok" => "ok"]);
        else
            $res->status(201)->json(["ok" => "ok", "insertId" => $result]);
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
        $numAffectedRows = $pagesRepo->updateById($pageType, $req->params->pageId,
                                                  $req->body);
        //
        if ($numAffectedRows !== 1) throw new PikeException(
            "Expected \$numAffectedRows to equal 1 but got {$numAffectedRows}",
            PikeException::INEFFECTUAL_DB_OP);
        //
        $res->status(200)->json(["ok" => "ok"]);
    }
    /**
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb $db
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     * @param \Sivujetti\SharedAPIContext $apiCtx
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     * @param \Sivujetti\Page\Entities\Page $page
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     */
    private static function sendPageResponse(Request $req,
                                             Response $res,
                                             FluentDb $db,
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
        $editModeIsOn = $isPlaceholderPage || ($req->queryVar("in-edit") !== null);
        $globalBlocksStyles = !$editModeIsOn ? [] : $db->select("\${p}globalBlocksStyles", "stdClass")
                ->fields(["globalBlockTreeId", "styles AS stylesJson"])
                ->mapWith(new class implements RowMapperInterface {
                    public function mapRow(object $row, int $_rowNum, array $_rows): ?object {
                        $row->styles = json_decode($row->stylesJson, flags: JSON_THROW_ON_ERROR);
                        return $row;
                    }
                })
                ->fetchAll();
        $tmpl = new WebPageAwareTemplate(
            $page->layout->relFilePath,
            ["serverHost" => self::getServerHost($req)],
            cssAndJsFiles: $apiCtx->userDefinedAssets,
            theme: $theWebsite->activeTheme,
            blocksStyles: array_merge(
                // Styles for all global block tree blocks
                !$globalBlocksStyles ? [] : array_reduce($globalBlocksStyles, fn($out, $gbs) =>
                    array_merge($out, $gbs->styles)
                , []),
                // Styles for this page's blocks
                $page->blockStyles
            ),
            pluginNames: array_map(fn($p) => $p->name, $theWebsite->plugins->getArrayCopy()),
            useInlineCssStyles: $editModeIsOn
        );
        $html = $tmpl->render([
            "currentPage" => $page,
            "currentUrl" => $req->path,
            "site" => $theWebsite,
        ]);
        if ($editModeIsOn && ($bodyEnd = strrpos($html, "</body>")) > 0) {
            $html = substr($html, 0, $bodyEnd) .
                "<script>window.sivujettiCurrentPageData = " . json_encode([
                    "page" => self::pageToRaw($page, $pageType, $isPlaceholderPage),
                    "layout" => self::layoutToRaw($page->layout),
                    "globalBlocksStyles" => $globalBlocksStyles,
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
                $blockType->onBeforeRender($block, $blockType, App::$adi);
            if ($block->children)
                self::runBlockBeforeRenderEvent($block->children, $blockTypes, $pagesRepo, $theWebsite);
        }
    }
    /**
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     * @return \Sivujetti\Page\Entities\Page
     */
    public static function createEmptyPage(PageType $pageType): Page {
        $page = new Page;
        $page->slug = "-";
        $page->path = "-";
        $page->level = 1;
        $page->title = $pageType->defaultFields->title->defaultValue;
        $page->meta = new \stdClass;
        $page->id = "-";
        $page->type = $pageType->name;
        $page->blocks = [];
        $page->blockStyles = [];
        $page->status = Page::STATUS_DRAFT;
        return $page;
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
            "meta" => $page->meta,
            "layoutId" => $page->layoutId,
            "status" => $page->status,
            "blocks" => $page->blocks,
            "blockStyles" => $page->blockStyles,
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
     * @param \Pike\Request $req
     * @return string "http://localhost", "https://server.com"
     */
    private static function getServerHost(Request $req): string {
        // https://stackoverflow.com/a/16076965
        $s = ($req->attr("HTTPS") === "on" ||
            $req->attr("HTTP_X_FORWARDED_PROTO") === "https" ||
            $req->attr("HTTP_X_FORWARDED_SSL") === "on") ? "s" : "";
        return "http{$s}://{$req->attr("HTTP_HOST")}";
    }
}
