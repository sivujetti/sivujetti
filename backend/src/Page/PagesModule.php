<?php declare(strict_types=1);

namespace KuuraCms\Page;

use Pike\AppContext;

final class PagesModule {
    public function init(AppContext $ctx): void {
        $ctx->router->map('GET', '/_edit/[**:url]?',
            [PagesController::class, 'renderPageInEditMode']
        );
        $ctx->router->map('GET', '/_placeholder-page/[w:pageId]/[*:layout]',
            [PagesController::class, 'renderPlaceholderPage']
        );
        $ctx->router->map('GET', '*',
            [PagesController::class, 'renderPage']
        );
        $ctx->router->map('POST', '/api/pages',
            [PagesController::class, 'createPage']
        );
        $ctx->router->map('PUT', '/api/pages/[w:pageId]',
            [PagesController::class, 'updatePage']
        );
        $ctx->router->map('DELETE', '/api/pages/[w:pageId]',
            [PagesController::class, 'deletePage']
        );
    }
}
