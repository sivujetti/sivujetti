<?php declare(strict_types=1);

namespace KuuraCms\Page;

use KuuraCms\SharedAPIContext;
use KuuraCms\TheWebsite\Entities\TheWebsite;
use KuuraCms\UserTheme\UserThemeAPI;
use MySite\Theme;
use Pike\{ArrayUtils, PikeException, Request, Response};

final class PagesController {
    /**
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \KuuraCms\Page\PagesRepository $pagesRepo
     * @param \KuuraCms\SharedAPIContext $storage
     * @param \KuuraCms\TheWebsite\Entities\TheWebsite $websiteState
     * @throws \Pike\PikeException
     */
    public function renderPage(Request $req,
                               Response $res,
                               PagesRepository $pagesRepo,
                               SharedAPIContext $storage,
                               TheWebsite $theWebsite): void {
        $themeAPI = new UserThemeAPI("theme", $storage);
        $_ = new Theme($themeAPI); // Note: mutates $storage->data
        //
        if (!($page = $pagesRepo->getSingle($theWebsite->pageTypes[0])
            ->where("\${t}.`slug`=?", $req->params->url)
            ->exec())) {
            $res->status(404)->html("404");
            return;
        }
        //
        $data = $storage->getDataHandle();
        $layout = ArrayUtils::findByKey($data->pageLayouts, $page->layoutId, "id");
        if (!$layout) throw new PikeException("Page layout #`{$page->layoutId}` not available",
                                              PikeException::BAD_INPUT);
        $fileId = $layout->relFilePath;
        $html = (new SiteAwareTemplate($fileId, cssFiles: $data->userDefinedCssFiles->webPage))->render([
            "page" => $page,
            "site" => $theWebsite,
        ]);
        if ($req->queryVar("in-edit") !== null &&
            ($bodyEnd = strrpos($html, "</body>")) > 0) {
            $html = substr($html, 0, $bodyEnd) .
                "<script>window.kuuraCurrentPageData = " . json_encode([
                    "blocks" => $page->blocks,
                ]) . "</script>" .
                "<script src=\"" . SiteAwareTemplate::makeUrl("public/kuura/kuura-webpage.js", false) . "\"></script>" .
            substr($html, $bodyEnd);
        }
        $res->html($html);
    }
    /**
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     */
    public function renderEditAppWrapper(Request $req, Response $res): void {
        $res->html((new SiteAwareTemplate("kuura:edit-app-wrapper.tmpl.php"))->render([
            "url" => $req->params->url ?? "",
            "userDefinedJsFiles" => [],
            "dataToFrontend" => json_encode((object) [
                "baseUrl" => SiteAwareTemplate::makeUrl('/', true),
                "assetBaseUrl" => SiteAwareTemplate::makeUrl('/', false),
            ])
        ]));
    }
}
