<?php declare(strict_types=1);

namespace KuuraCms\Page;

use KuuraCms\AppContext;

final class PagesModule {
    /**
     * @param \KuuraCms\AppContext $ctx
     */
    public function init(AppContext $ctx): void {
        $ctx->router->map('GET', '[*:url]',
            [PagesController::class, 'renderPage']
        );
    }
}
