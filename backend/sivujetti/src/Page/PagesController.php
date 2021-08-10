<?php declare(strict_types=1);

namespace Sivujetti\Page;

use Sivujetti\Page\Entities\Page;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\{SharedAPIContext, Translator};
use Sivujetti\TheWebsite\Entities\TheWebsite;
use Sivujetti\UserTheme\UserThemeAPI;
use MySite\Theme;
use Pike\{ArrayUtils, PikeException, Request, Response};

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
     * @param \Sivujetti\SharedAPIContext $storage
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
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
                "blockTypes" => $storage->getDataHandle()->blockTypes,
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
        if ($req->params->pageType !== PageType::PAGE)
            throw new \RuntimeException("Not implemented yet.");
        //
        $num = $pagesRepo->insert($req->params->pageType, $req->body);
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
        if ($req->params->pageType !== PageType::PAGE)
            throw new \RuntimeException("Not implemented yet.");
        //
        $pseudoPage = new \stdClass;
        $pseudoPage->type = $req->params->pageType;
        $pseudoPage->blocks = $req->body->blocks;
        $num = $pagesRepo->updateById($req->params->pageId,
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
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     * @param \Sivujetti\SharedAPIContext $storage
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     * @param ?\Sivujetti\Page\Entities\Page $page = null
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
                "<script>window.sivujettiCurrentPageData = " . json_encode([
                    "page" => (object) [
                        "id" => $page->id,
                        "type" => $page->type,
                        "layoutId" => $page->layoutId,
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
}
