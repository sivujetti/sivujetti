<?php declare(strict_types=1);

namespace KuuraCms\PageType;

use Pike\AppContext;

final class PageTypesModule {
    public function init(AppContext $ctx): void {
        $ctx->router->map('GET', '/api/page-types/[w:filter]',
            [PageTypesController::class, 'getPageTypes']
        );
    }
}
