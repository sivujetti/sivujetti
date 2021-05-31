<?php declare(strict_types=1);

namespace KuuraCms\Page;

use KuuraCms\Entities\{Block, Listing, Page, WebSite};
use KuuraCms\{SharedAPIContext, Template};
use Pike\{Db, Request, Response};

final class PagesController {
    public function renderPage(Request $req, Response $res, Db $db, SharedAPIContext $storage): void {
        if (!($page = self::foss($req->path, $db))) {
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
        if ($req->queryVar('in-edit') !== null &&
            ($bodyEnd = strpos($html, '</body>')) > 0)
            $html = substr($html, 0, $bodyEnd) .
                '<script>window.kuuraCurrentPageData = ' . json_encode($page->blocks) . '</script>' .
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
    private static function foss(string $path, Db $db): Page {
        return match ($path) {
            '/' => self::getHomePage(),
            '/yritys' => self::getYritysPage(),
            '/palvelut' => self::getPalvelutPage(),
            '/yhteys' => self::getYhteysPage(),
            default => null
        };
    }
    private static function getHomePage(): Page {
        $page = new Page;
        $page->title = 'Perussivustoesimerkki';
        $page->template = 'layout.full-width.tmpl.php';
        $page->blocks = self::foo($page->title);
        $page->blocks[] = self::dos();
        return $page;
    }
    private static function dos(): Block {
        $out3 = new Block;
        $out3->type = Block::TYPE_FORMATTED_TEXT + 1;
        $out3->slot = 'main';
        $out3->renderer = 'my-site-text-and-image';
        $out3->id = '4';
        $out3->imageSrc = 'sample.jpg';
        $out3->html = '<pre>Html:ää</pre>';
        return $out3;
    }
    private static function getYritysPage(): Page {
        $page = new Page;
        $page->title = 'Yritys';
        $page->template = 'layout.full-width.tmpl.php';
        $page->blocks = self::foo($page->title);
        return $page;
    }
    private static function getPalvelutPage(): Page {
        $page = new Page;
        $page->title = 'Palvelut';
        $page->template = 'layout.with-sidebar.tmpl.php';
        $page->blocks = array_merge(self::foo($page->title), self::bar());
        return $page;
    }
    private static function getYhteysPage(): Page {
        $page = new Page;
        $page->title = 'Yhteys';
        $page->template = 'layout.full-width.tmpl.php';
        $page->blocks = self::foo($page->title);
        return $page;
    }
    private static function foo($fos): array {
        $out = new Block;
        $out->type = Block::TYPE_HEADING;
        $out->slot = 'main';
        $out->renderer = 'auto';
        $out->id = '1';
        $out->level = 1;
        $out->text = $fos;

        $out2 = new Block;
        $out2->type = Block::TYPE_PARAGRAPH;
        $out2->slot = 'main';
        $out2->renderer = 'auto';
        $out2->id = '2';
        $out2->text = "{$fos} lorem ipsum";

        $out3 = new Block;
        $out3->type = Block::TYPE_FORMATTED_TEXT;
        $out3->slot = 'main';
        $out3->renderer = 'auto';
        $out3->id = '3';
        $out3->html = '<pre>Html:ää</pre>';

        return [$out, $out2, $out3];
    }
    private static function bar(): array {
        $out = new Listing;
        $foo = function () {
            $page1 = new Page;
            $page1->title = '<pseudo>';
            $page1->blocks = self::foo('Sivupalkki1');
            $page1->blocks[0]->level = 2;
            $page2 = new Page;
            $page2->title = '<pseudo>';
            $page2->blocks = self::foo('Sivupalkki2');
            $page2->blocks[0]->level = 2;
            return [$page1, $page2];
        };
        $out->pages = $foo();
        $out->slot = 'sidebar';
        $out->renderer = 'auto';
        $out->id = 1;
        return [$out];
    }
    private static function baz(): WebSite {
        $out = new WebSite;
        $out->name = 'My site';
        $out->lang = 'fi';
        return $out;
    }
}
