<?php declare(strict_types=1);

namespace KuuraCms\Page;

use KuuraCms\Page\Entities\Page;
use KuuraCms\PageType\Entities\PageType;
use KuuraCms\{SharedAPIContext, Translator};
use KuuraCms\TheWebsite\Entities\TheWebsite;
use KuuraCms\UserTheme\UserThemeAPI;
use MySite\Theme;
use Pike\{ArrayUtils, PikeException, Request, Response};

final class PagesController {
    /**
     * GET /[anything]: Renders a page.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \KuuraCms\Page\PagesRepository $pagesRepo
     * @param \KuuraCms\SharedAPIContext $storage
     * @param \KuuraCms\TheWebsite\Entities\TheWebsite $theWebsite
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
     * @param \KuuraCms\Page\PagesRepository $pagesRepo
     * @param \KuuraCms\SharedAPIContext $storage
     * @param \KuuraCms\TheWebsite\Entities\TheWebsite $theWebsite
     * @throws \Pike\PikeException
     */
    public function renderPlaceholderPage(Request $req,
                                          Response $res,
                                          PagesRepository $pagesRepo,
                                          SharedAPIContext $storage,
                                          TheWebsite $theWebsite): void {
        if ($req->params->pageType !== PageType::PAGE)
            throw new \RuntimeException("Not implemented yet.");
        //
        $page = new Page;
        $page->slug = "-";
        $page->title = "-";
        $page->layoutId = $req->params->layoutId;
        $page->id = "-";
        $page->type = $req->params->pageType;
        $page->blocks = []; // set by self::sendPageRequest()
        $page->status = Page::STATUS_DRAFT;
        $page->layout = (object) ["blocks" => []];
        //
        self::sendPageResponse($req, $res, $pagesRepo, $storage, $theWebsite, $page);
    }
    /**
     * GET /_edit/[**:url]?: Renders the edit app.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     */
    public function renderEditAppWrapper(Request $req, Response $res): void {
        $res->html((new SiteAwareTemplate("kuura:edit-app-wrapper.tmpl.php"))->render([
            "url" => $req->params->url ?? "",
            "userDefinedJsFiles" => [],
            "dataToFrontend" => json_encode((object) [
                "baseUrl" => SiteAwareTemplate::makeUrl("/", true),
                "assetBaseUrl" => SiteAwareTemplate::makeUrl("/", false),
            ])
        ]));
    }
    /**
     * POST /api/pages/[w:pageType]: Inserts a new page to the database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \KuuraCms\Page\PagesRepository $pagesRepo
     */
    public function createPage(Request $req,
                               Response $res,
                               PagesRepository $pagesRepo): void {
        if ($req->params->pageType !== PageType::PAGE)
            throw new \RuntimeException("Not implemented yet.");
        //
        $num = $pagesRepo->insert(PageType::PAGE, $req->body);
        //
        if ($num !== 1)
            throw new PikeException("Expected \$numAffectedRows to equal 1 but got $num",
                PikeException::INEFFECTUAL_DB_OP);
        //
        $res->status(201)->json(["ok" => "ok"]);
    }
    /**
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \KuuraCms\Page\PagesRepository $pagesRepo
     * @param \KuuraCms\SharedAPIContext $storage
     * @param \KuuraCms\TheWebsite\Entities\TheWebsite $theWebsite
     * @param ?\KuuraCms\Page\Entities\Page $page = null
     * @throws \Pike\PikeException
     */
    private static function sendPageResponse(Request $req,
                                             Response $res,
                                             PagesRepository $pagesRepo,
                                             SharedAPIContext $storage,
                                             TheWebsite $theWebsite,
                                             ?Page $pageIn = null) {
        $themeAPI = new UserThemeAPI("theme", $storage, new Translator);
        $_ = new Theme($themeAPI); // Note: mutates $storage->data
        $isPlaceholderPage = $pageIn !== null;
        //
        if (!$isPlaceholderPage) {
            if (!($page = $pagesRepo->getSingle($theWebsite->pageTypes[0])
                ->where("\${t}.`slug`=?", $req->params->url)
                ->exec())) {
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
        if ($isPlaceholderPage) $page->blocks = $layout->getInitialBlocks->__invoke();
        //
        $html = (new SiteAwareTemplate($layout->relFilePath, cssFiles: $data->userDefinedCssFiles->webPage))->render([
            "page" => $page,
            "site" => $theWebsite,
        ]);
        if (($isPlaceholderPage || $req->queryVar("in-edit") !== null) &&
            ($bodyEnd = strrpos($html, "</body>")) > 0) {
            $html = substr($html, 0, $bodyEnd) .
                "<script>window.kuuraCurrentPageData = " . json_encode([
                    "page" => (object) [
                        "id" => $page->id,
                        "type" => $page->type,
                        "blocks" => $page->blocks,
                        "isPlaceholderPage" => $isPlaceholderPage,
                    ],
                    "layoutBlocks" => $page->layout->blocks,
                    "layouts" => $storage->getDataHandle()->pageLayouts,
                ]) . "</script>" .
                "<script src=\"" . SiteAwareTemplate::makeUrl("public/kuura/kuura-webpage.js", false) . "\"></script>" .
            substr($html, $bodyEnd);
        }
        $res->html($html);
    }
}
