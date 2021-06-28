<?php declare(strict_types=1);

namespace KuuraCms\Page;

use Pike\{Request, Response};

final class PagesController {
    public static $blockTypes;
    /**
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     */
    public function renderPage(Request $req, Response $res): void {
        $res->plain("Rendering page.");
    }
}
