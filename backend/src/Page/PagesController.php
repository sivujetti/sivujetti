<?php declare(strict_types=1);

namespace KuuraCms\Page;

use KuuraCms\Entities\WebSite;
use KuuraCms\{SharedAPIContext, Template};
use Pike\{Db, Request, Response};

final class PagesController {
    public static $blockTypes;
    public function renderPage(Request $req,
                               Response $res,
                               Todo $paegRepo,
                               SharedAPIContext $storage): void {
        // move this to App->openDbAndLoadState() ?
        $rows = $paegRepo->tempFetchPages('p.`slug` = ?', $req->path);
        if (!($page = $paegRepo->temp2($rows))) {
            $res->plain('404'); // @todo custom 404 pages
            return;
        }
        self::$blockTypes = $storage->getDataHandle()->blockTypes;
        $html = (new Template(KUURA_WORKSPACE_PATH . "site/templates/{$page->template}",
                              null,
                              array_map(fn($t) =>
                                KUURA_WORKSPACE_PATH . "site/{$t()->getDefaultRenderer()}" // Quaranteed to be valid (see WebsiteApi->registerBlockType())
                              , self::$blockTypes)))->render([
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

    private static function baz(): WebSite {
        $out = new WebSite;
        $out->name = 'My site';
        $out->lang = 'fi';
        return $out;
    }
}
