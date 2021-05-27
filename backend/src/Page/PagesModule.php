<?php declare(strict_types=1);

namespace KuuraCms\Page;

use Pike\AppContext;

final class PagesModule {
    public function init(AppContext $ctx): void {
        $ctx->router->map('GET', '*',
            [PagesController::class, 'renderPage']
        );
    }
}
