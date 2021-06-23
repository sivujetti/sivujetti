<?php declare(strict_types=1);

namespace KuuraCms\Page;

use KuuraCms\Entities\TheWebsite;
use KuuraCms\{SharedAPIContext, Template};
use KuuraCms\Block\BlocksRepository;
use KuuraCms\Block\SelectBlocksQuery;
use KuuraCms\Block\Entities\Block;
use KuuraCms\Page\Entities\Page;
use KuuraCms\Page\Entities\PageLayout;
use KuuraCms\Theme\ThemeAPI;
use KuuraSite\Theme;
use Pike\{ArrayUtils, Db, FileSystem, PikeException, Request, Response};

final class PagesController {
    public static $blockTypes;
    public function renderPage(Request $req,
                               Response $res,
                               Todo $paegRepo,
                               SharedAPIContext $storage,
                               TheWebsite $theWebsite,
                               FileSystem $fs,
                               BlocksRepository $br): void {
        $themeAPI = new ThemeAPI('theme', $storage, $fs);
        $theme = new Theme($themeAPI); // Note: mutates $this->storage->data
        $storage->triggerEvent('kuuraOnPageRequestInitialized', '@@@');
        //
        $page = $paegRepo->tempFetch('Pages', '`slug` = ?', $req->path);
        if (!$page) $page = $paegRepo->tempFetch('Products', '`slug` = ?', $req->path);
        if (!$page) {
            $res->plain('404'); // @todo custom 404 pages
            return;
        }
        self::$blockTypes = $storage->getDataHandle()->blockTypes;
        $html = (new Template(ArrayUtils::findByKey($storage->getDataHandle()->pageLayouts, $page->layoutId, 'id')->relFilePath, // becomes KUURA_WORKSPACE_PATH . "site/templates/{$relFilePath}"
                              null,
                              function($section) use ($br): SelectBlocksQuery {
                                  return $br->fetchAll('', $section);
                              }))->render([
            'page' => $page,
            'site' => $theWebsite,
            'urlStr' => $req->path,
        ]);
        //
        if ($req->queryVar('in-edit') !== null &&
            ($headEnd = strpos($html, '</head>')) > 0) {
            //
            $html = substr($html, 0, $headEnd) .
                '<link rel="stylesheet" href="' . Template::makeUrl('public/kuura/quill-kuura.css', false) . '">' .
            substr($html, $headEnd);
            //
            if (($bodyEnd = strpos($html, '</body>')) > 0)
                $html = substr($html, 0, $bodyEnd) .
                    '<script>window.kuuraCurrentPageData = ' . json_encode([
                        'page' => (object) [
                        'id' => $page->id,
                        'layoutId' => $page->layoutId
                        ],
                        'isNewPage' => false,
                        'blocks' => $this->getBlocksDeep(array_merge($br->getResults(), $page->blocks), $storage->di),
                        'theme' => (object) ['pageLayouts' => $storage->getDataHandle()->pageLayouts],
                    ]) . '</script>' .
                    '<script src="' . Template::makeUrl('public/kuura/vendor/quill.min.js', false) . '"></script>' .
                    '<script src="' . Template::makeUrl('public/kuura/kuura-webpage.js', false) . '"></script>' .
                substr($html, $bodyEnd);
        }
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
    private static function createPlaceholderPage(PageLayout $layout): Page {
        $out = new Page;
        $out->slug = 'placeholder';
        $out->title = 'New page';
        $out->layoutId = $layout->id;
        $out->id = 'placeholder';
        $out->type = Page::TYPE_PAGE;
        $out->blocks = $layout->initialBlocks;
        return $out;
    }
    public function renderPlaceholderPage(Request $req,
                                          Response $res,
                                          TheWebsite $theWebsite,
                                          SharedAPIContext $storage,
                                          FileSystem $fs,
                                          BlocksRepository $br): void {
        $themeAPI = new ThemeAPI('theme', $storage, $fs);
        $theme = new Theme($themeAPI); // Note: mutates $this->storage->data
        //
        $pls = $storage->getDataHandle()->pageLayouts;
        $pl = ArrayUtils::findByKey($pls, $req->params->layoutId, 'id');
        $page = self::createPlaceholderPage($pl);

        $html = (new Template($pl->relFilePath, // KUURA_WORKSPACE_PATH . "site/templates/{$l}"
                              null,
                              function() use ($br): SelectBlocksQuery {
                                  return $br->fetchAll('', '<layout>');
                              }))->render([
            'page' => $page,
            'site' => $theWebsite,
            'urlStr' => $req->path,
        ]);
        //
        if (($bodyEnd = strpos($html, '</body>')) > 0)
            $html = substr($html, 0, $bodyEnd) .
                '<script>window.kuuraCurrentPageData = ' . json_encode([
                    'page' => (object) [
                    'id' => $page->id,
                    'layoutId' => $pl->id,
                    ],
                    'isNewPage' => true,
                    'blocks' => $this->getBlocksDeep(array_merge($br->getResults(), $page->blocks), $storage->di),
                    'theme' => (object) ['pageLayouts' => $pls],
                ]) . '</script>' .
                '<script src="' . Template::makeUrl('public/kuura/kuura-webpage.js', false) . '"></script>' .
            substr($html, $bodyEnd);
        //
        $res->html($html);
    }
    private function getBlocksDeep(array $blocks, $di): array {
        $dynamicBlocks = [];
        foreach ($blocks as $block) {
            $makeBlockType = self::$blockTypes[$block->type] ?? null;
            if (!$makeBlockType) continue;
            $blockType = $makeBlockType instanceof \Closure ? $makeBlockType() : $di->make($makeBlockType);
            if (method_exists($blockType, 'onBeforeRenderPage'))
                $dynamicBlocks = array_merge($dynamicBlocks, $blockType->onBeforeRenderPage($blocks));
        }
        return array_merge($blocks, $dynamicBlocks);
    }
    public function createPage(Request $req,
                               Response $res,
                               Db $db,
                               BlocksRepository $br,
                               bool $performMenuAutoAdd = true): void {
        // todo validate input

        if (!($pageType = $db->fetchOne(
            "SELECT `id` FROM `pageTypes` WHERE `name` = ?",
            [$req->body->pageTypeName],
            \PDO::FETCH_ASSOC
        ))) throw new PikeException('hj');

        [$qList, $values, $columns] = $db->makeInsertQParts([
            'slug' => $req->body->slug,
            'path' => $req->body->path, // todo create patcher (db trigger) for empty values
            'level' => $req->body->level,
            'title' => $req->body->title,
            'layoutId' => $req->body->layoutId,
            'blocks' => '[]',
            'pageTypeId' => $pageType['id'],
        ]);
        if ($db->exec("INSERT INTO `pages` ({$columns}) VALUES ({$qList})",
                      $values) !== 1 || !($insertId = $db->lastInsertId()))
            throw new PikeException('hj');

        if ($performMenuAutoAdd) {
            // $menus = $br->fetchAll()->where('type', Block::TYPE_MENU)->exec();
            // $toAdd = ArrayUtils::filterByKey($menus, 'yes', 'doAddTopLevelPagesAutomatically');
            // todo foreach ($toAdd as $block) { json_decode($block->tree)[] = thisPage; $db->save($block); }
        }

        $res->json(['ok' => $insertId ? 'ok' : 'err',
                    'insertId' => $insertId]);
    }
    public function updatePage(Request $req,
                               Response $res,
                               Todo $pageRepo): void {
        if (!$pageRepo->tempFetch(Page::TYPE_PAGE, '@simple', $req->params->pageId))
            throw new PikeException('Invalid pageId');
        $pageRepo->tempUpdate($req->params->pageId, (object) [
            'slug' => $req->body->slug,
            'title' => $req->body->title,
            'layoutId' => $req->body->layoutId,
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
