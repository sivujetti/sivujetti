<?php declare(strict_types=1);

namespace KuuraCms\Page;

use KuuraCms\Entities\TheWebsite;
use KuuraCms\{SharedAPIContext, Template};
use KuuraCms\Theme\ThemeAPI;
use KuuraSite\Theme;
use Pike\{Db, FileSystem, PikeException, Request, Response};

final class PagesController {
    public static $blockTypes;
    public function renderPage(Request $req,
                               Response $res,
                               Todo $paegRepo,
                               SharedAPIContext $storage,
                               TheWebsite $theWebsite,
                               FileSystem $fs): void {
        $themeAPI = new ThemeAPI('theme', $storage, $fs);
        $theme = new Theme($themeAPI); // Note: mutates $this->storage->data
        //
        $rows = $paegRepo->tempFetch('Pages', '`slug` = ?', $req->path);
        if (!($page = $paegRepo->temp2($rows))) {
            $res->plain('404'); // @todo custom 404 pages
            return;
        }
        self::$blockTypes = $storage->getDataHandle()->blockTypes;
        $html = (new Template($page->layout // becomes KUURA_WORKSPACE_PATH . "site/templates/{$page->layout}"
                              ))->render([
            'page' => $page,
            'site' => $theWebsite,
        ]);
        //
        if ($req->queryVar('in-edit') !== null &&
            ($bodyEnd = strpos($html, '</body>')) > 0)
            $html = substr($html, 0, $bodyEnd) .
                '<script>window.kuuraCurrentPageData = ' . json_encode([
                    'page' => (object) [
                    'id' => $page->id,
                    'layout' => $page->layout
                    ],
                    'isNewPage' => false,
                    'blocks' => $this->getBlocksDeep($page->blocks),
                    'theme' => (object) ['pageLayouts' => $storage->getDataHandle()->pageLayouts],
                ]) . '</script>' .
                '<script src="' . Template::makeUrl('public/kuura/kuura-webpage.js', false) . '"></script>' .
            substr($html, $bodyEnd);
        $res->html($html);
    }
    public function renderPageInEditMode(Request $req, Response $res, SharedAPIContext $storage): void {
        //
        $res->html((new Template('kuura:edit-app-wrapper.tmpl.php'))->render([
            'url' => $req->params->url ?? '',
            'userDefinedJsFiles' => $storage->getDataHandle()->userDefinedJsFiles->editApp,
            'dataToEditApp' => (object) [],
        ]));
    }
    public function renderPlaceholderPage(Request $req,
                                          Response $res,
                                          Todo $paegRepo,
                                          TheWebsite $theWebsite,
                                          SharedAPIContext $storage,
                                          FileSystem $fs): void {
        $themeAPI = new ThemeAPI('theme', $storage, $fs);
        $theme = new Theme($themeAPI); // Note: mutates $this->storage->data
        //
        $rows = $paegRepo->tempFetch('Pages', '`id` = ?', $req->params->pageId);
        if (!($page = $paegRepo->temp2($rows)))
            throw new PikeException('Invalid pageId');
        // todo check that page->status == STATUS_CREATING

        // todo validate req->params->layout

        $html = (new Template(urldecode($req->params->layout) // KUURA_WORKSPACE_PATH . "site/templates/{$l}"
                              ))->render([
            'page' => $page,
            'site' => $theWebsite,
        ]);
        //
        if (($bodyEnd = strpos($html, '</body>')) > 0)
            $html = substr($html, 0, $bodyEnd) .
                '<script>window.kuuraCurrentPageData = ' . json_encode([
                    'page' => (object) [
                    'id' => $page->id,
                    'layout' => $req->params->layout,
                    ],
                    'isNewPage' => true,
                    'blocks' => $this->getBlocksDeep($page->blocks),
                    'theme' => (object) ['pageLayouts' => $storage->getDataHandle()->pageLayouts],
                ]) . '</script>' .
                '<script src="' . Template::makeUrl('public/kuura/kuura-webpage.js', false) . '"></script>' .
            substr($html, $bodyEnd);
        //
        $res->html($html);
    }
    private function getBlocksDeep(array $blocks): array {
        $dynamicBlocks = [];
        foreach ($blocks as $block) {
            $makeBlockType = self::$blockTypes[$block->type] ?? null;
            if (!$makeBlockType) continue;
            $blockType = $makeBlockType();
            if (method_exists($blockType, 'onBeforeRenderPage'))
                $dynamicBlocks = array_merge($dynamicBlocks, $blockType->onBeforeRenderPage($blocks));
        }
        return array_merge($blocks, $dynamicBlocks);
    }
    public function createPage(Request $req, Response $res, Db $db): void {
        // todo validate input

        if (!($pageType = $db->fetchOne(
            "SELECT `id` FROM `pageTypes` WHERE `name` = ?",
            [$req->body->pageTypeName],
            \PDO::FETCH_ASSOC
        ))) throw new PikeException('hj');

        [$qList, $values, $columns] = $db->makeInsertQParts([
            'slug' => $req->body->slug,
            'title' => $req->body->title,
            'layout' => $req->body->layout,
            'pageTypeId' => $pageType['id'],
        ]);
        if ($db->exec("INSERT INTO `pages` ({$columns}) VALUES ({$qList})",
                      $values) !== 1)
            throw new PikeException('hj');
        $insertId = $db->lastInsertId();

        $res->json(['ok' => $insertId ? 'ok' : 'err',
                    'insertId' => $insertId]);
    }
    public function updatePage(Request $req,
                               Response $res,
                               Todo $pageRepo): void {
        $rows = $pageRepo->tempFetch('Pages', '`id` = ?', $req->params->pageId);
        if (!($page = $pageRepo->temp2($rows)))
            throw new PikeException('Invalid pageId');
        $pageRepo->tempUpdate($req->params->pageId, (object) [
            'slug' => $req->body->slug,
            'title' => $req->body->title,
            'layout' => $req->body->layout,
            'status' => $req->body->status,
        ]);
        $res->json(['ok' => 'ok']);
    }
    public function deletePage(Request $req,
                               Response $res,
                               Todo $pageRepo): void {
        $pageRepo->tempDelete($req->params->pageId, true);
        $res->json(['ok' => 'ok']);
    }
}
