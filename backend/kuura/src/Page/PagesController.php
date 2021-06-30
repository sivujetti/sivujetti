<?php declare(strict_types=1);

namespace KuuraCms\Page;

use KuuraCms\{SharedAPIContext, Template};
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
        $themeAPI = new UserThemeAPI('theme', $storage);
        $_ = new Theme($themeAPI); // Note: mutates $storage->data
        //
        $page = $pagesRepo->getSingle($theWebsite->pageTypes[0])
            ->where("\${t}.`slug`=?", $req->params->url)
            ->exec();
        if (!$page) {
            $res->status(404)->html('404');
            return;
        }
        //
        $layout = ArrayUtils::findByKey($storage->getDataHandle()->pageLayouts, $page->layoutId, 'id');
        if (!$layout) throw new PikeException("Page layout #`{$page->layoutId}` not available",
                                              PikeException::BAD_INPUT);
        $fileId = $layout->relFilePath;
        $html = (new Template($fileId))->render([
            'page' => $page,
            'site' => $theWebsite,
        ]);
        $res->html($html);
    }
}
