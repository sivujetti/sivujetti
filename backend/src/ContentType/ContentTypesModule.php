<?php declare(strict_types=1);

namespace KuuraCms\ContentType;

use Pike\AppContext;

final class ContentTypesModule {
    public function init(AppContext $ctx): void {
        $ctx->router->map('GET', '/api/content-types/[listable:filters]',
            [ContentTypesController::class, 'getContentTypes']
        );
    }
}
