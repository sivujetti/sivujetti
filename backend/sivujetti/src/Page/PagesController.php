<?php declare(strict_types=1);

namespace Sivujetti\Page;

use MySite\Theme;
use Pike\{ArrayUtils, PikeException, Request, Response};
use Sivujetti\Page\Entities\Page;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\{SharedAPIContext, Template, Translator};
use Sivujetti\Block\Entities\Block;
use Sivujetti\TheWebsite\Entities\TheWebsite;
use Sivujetti\UserTheme\UserThemeAPI;
use Sivujetti\BlockType\Entities\BlockTypes;
use Sivujetti\BlockType\ListeningBlockTypeInterface;
use Sivujetti\Layout\LayoutBlocksRepository;

final class PagesController {
    /**
     * GET /[anything]: Renders a page.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     * @param \Sivujetti\SharedAPIContext $storage
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     */
    public function renderPage(Request $req,
                               Response $res,
                               PagesRepository $pagesRepo,
                               SharedAPIContext $storage,
                               TheWebsite $theWebsite): void {
        self::sendPageResponse($req, $res, $pagesRepo, $storage, $theWebsite);
    }
    /**
     * GET /api/_placeholder-page/[w:pageType]/[i:layoutId]: renders a placeholder
     * page for "Create page" functionality.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     * @param \Sivujetti\Layout\LayoutBlocksRepository $layoutBlocksRepo
     * @param \Sivujetti\SharedAPIContext $storage
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     * @throws \Pike\PikeException
     */
    public function renderPlaceholderPage(Request $req,
                                          Response $res,
                                          PagesRepository $pagesRepo,
                                          LayoutBlocksRepository $layoutBlocksRepo,
                                          SharedAPIContext $storage,
                                          TheWebsite $theWebsite): void {
        $pageType = $pagesRepo->getPageTypeOrThrow($req->params->pageType);
        //
        $page = new Page;
        $page->slug = "-";
        $page->path = "-";
        $page->level = 1;
        $page->title = $pageType->defaultFields->title->defaultValue;
        $page->layoutId = $req->params->layoutId;
        $page->id = "-";
        $page->type = $req->params->pageType;
        $page->blocks = array_map(fn($b) => Block::fromBlueprint($b), $pageType->blockFields);
        $page->status = Page::STATUS_DRAFT;
        $page->layout = (object) ["blocks" => []];
        //
        self::sendPageResponse($req, $res, $pagesRepo, $storage, $theWebsite,
            $page, $layoutBlocksRepo);
    }
    /**
     * GET /_edit/[**:url]?: Renders the edit app.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\TheWebsite $theWebsite 
     * @param \Sivujetti\SharedAPIContext $storage 
     */
    public function renderEditAppWrapper(Request $req,
                                         Response $res,
                                         TheWebsite $theWebsite,
                                         SharedAPIContext $storage): void {
        $res->html((new SiteAwareTemplate("sivujetti:edit-app-wrapper.tmpl.php"))->render([
            "url" => $req->params->url ?? "",
            "userDefinedJsFiles" => $storage->getDataHandle()->adminJsFiles,
            "dataToFrontend" => json_encode((object) [
                "baseUrl" => SiteAwareTemplate::makeUrl("/", true),
                "assetBaseUrl" => SiteAwareTemplate::makeUrl("/", false),
                "pageTypes" => $theWebsite->pageTypes->getArrayCopy(),
            ])
        ]));
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
     * of $req->params->pageId.
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
     * @param \Sivujetti\SharedAPIContext $storage
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     * @param ?\Sivujetti\Page\Entities\Page $pageIn = null
     * @param ?\Sivujetti\Layout\LayoutBlocksRepository $layoutBlocksRepo = null
     * @throws \Pike\PikeException
     */
    private static function sendPageResponse(Request $req,
                                             Response $res,
                                             PagesRepository $pagesRepo,
                                             SharedAPIContext $storage,
                                             TheWebsite $theWebsite,
                                             ?Page $pageIn = null,
                                             ?LayoutBlocksRepository $layoutBlocksRepo = null) {
        $themeAPI = new UserThemeAPI("theme", $storage, new Translator);
        $_ = new Theme($themeAPI); // Note: mutates $storage->data
        $isPlaceholderPage = $pageIn !== null;
        //
        if (!$isPlaceholderPage) {
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
        } else {
            $page = $pageIn;
        }
        //
        $data = $storage->getDataHandle();
        $layout = ArrayUtils::findByKey($data->pageLayouts, $page->layoutId, "id");
        if (!$layout) throw new PikeException("Page layout #`{$page->layoutId}` not available",
                                              PikeException::BAD_INPUT);
        if ($isPlaceholderPage)
            $page->layout->blocks = $layoutBlocksRepo->getMany($page->layoutId)[0]->blocks;
        //
        self::runBlockBeforeRenderEvent($page->blocks, $data->blockTypes, $pagesRepo, $theWebsite);
        self::runBlockBeforeRenderEvent($page->layout->blocks, $data->blockTypes, $pagesRepo, $theWebsite);
        $html = (new SiteAwareTemplate($layout->relFilePath, cssFiles: $data->userDefinedCssFiles->webPage))->render([
            "page" => $page,
            "site" => $theWebsite,
        ]);
        if (($isPlaceholderPage || $req->queryVar("in-edit") !== null) &&
            ($bodyEnd = strrpos($html, "</body>")) > 0) {
            $html = substr($html, 0, $bodyEnd) .
                "<script>window.sivujettiCurrentPageData = " . json_encode([
                    "page" => (object) [
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
                    ],
                    "layoutBlocks" => $page->layout->blocks,
                    "layouts" => $storage->getDataHandle()->pageLayouts,
                ]) . "</script>" .
                "<script src=\"" . SiteAwareTemplate::makeUrl("public/sivujetti/sivujetti-webpage.js", false) . "\"></script>" .
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
                $blockType->onBeforeRender($block, $blockType, $pagesRepo, $theWebsite);
            if ($block->children)
                self::runBlockBeforeRenderEvent($block->children, $blockTypes, $pagesRepo, $theWebsite);
        }
    }
}
