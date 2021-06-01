<?php declare(strict_types=1);

namespace KuuraCms\Page;

use KuuraCms\Entities\{Block, Page, WebSite};
use KuuraCms\{SharedAPIContext, Template};
use KuuraCms\Defaults\ListingBlockType;
use Pike\{Db, Request, Response};

final class PagesController {
    public static $blockTypes;
    public function __construct() {
        self::$blockTypes = [Block::TYPE_LISTING => fn() => new ListingBlockType];
    }
    public function renderPage(Request $req,
                               Response $res,
                               Db $db,
                               SharedAPIContext $storage): void {
        if (!($page = self::tempFetchPage($req->path, $db))) {
            $res->plain('404'); // @todo custom 404 pages
            return;
        }
        $html = (new Template(KUURA_WORKSPACE_PATH . "site/templates/{$page->template}",
                              null,
                              array_map(fn ($blockType) =>
                                KUURA_WORKSPACE_PATH . "site/$blockType[1]" // Quaranteed to be valid (see WebsiteApi->registerBlockType())
                              , $storage->getDataHandle()->userDefinedBlockTypes)))->render([
            'page' => $page,
            'site' => self::baz()
        ]);
        //
        if ($req->queryVar('in-edit') !== null &&
            ($bodyEnd = strpos($html, '</body>')) > 0)
            $html = substr($html, 0, $bodyEnd) .
                '<script>window.kuuraCurrentPageData = ' . json_encode($this->getBlocksDeep($page->blocks)) . '</script>' .
                '<script src="' . Template::makeUrl('public/kuura/kuura-webpage.js', false) . '"></script>' .
            substr($html, $bodyEnd);
        $res->html($html);
    }
    public function renderPageInEditMode(Request $req, Response $res, Db $db, SharedAPIContext $storage): void {
        //
        $res->html((new Template(KUURA_BACKEND_PATH . 'assets/templates/edit-app-wrapper.tmpl.php'))->render([
            'url' => $req->params->url ?? '',
            'userDefinedJsFiles' => $storage->getDataHandle()->userDefinedJsFiles->editApp,
        ]));
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
    public static function tempFetchPages($temp1, $temp2, $db): array {
        return $db->fetchAll(
            'SELECT p.`title`,p.`template`' .
            ',b.`type` AS `blockType`,b.`section` AS `blockSection`,b.`renderer` AS `blockRenderer`,b.`id` AS `blockId`' .
            ',bp.`blockId` AS `blockPropBlockId`,bp.`key` AS `blockPropKey`,bp.`value` AS `blockPropValue`' .
            ' from `pages` p' .
            ' JOIN `blocks` b ON (b.`pageId` = p.`id`)' .
            ' JOIN `blockProps` bp ON (bp.`blockId` = b.`id`)' .
            " WHERE {$temp1}",
            [$temp2],
            \PDO::FETCH_CLASS,
            Page::class
        );
    }
    public static function temp2(array $rows, Db $db): ?Page {
        if (!$rows)
            return null;
        $page = $rows[0];
        $page->blocks = [];
        foreach ($rows as $row) {
            if (array_reduce($page->blocks, fn($prev, $block) =>
                !$prev ? $block->id === $row->blockId : $prev,
            null)) continue;
            $b = Block::fromDbResult($row, $rows);
            $makeBlockType = self::$blockTypes[$b->type] ?? null;
            if ($makeBlockType)
                $makeBlockType()->fetchData($b, $db);
            $page->blocks[] = $b;
        }
        return $page;
    }
    // move this to App->openDbAndLoadState() ?
    private static function tempFetchPage(string $path, Db $db): Page {
        $rows = self::tempFetchPages('p.`slug` = ?', $path, $db);
        return self::temp2($rows, $db);
    }
    private static function baz(): WebSite {
        $out = new WebSite;
        $out->name = 'My site';
        $out->lang = 'fi';
        return $out;
    }
}
