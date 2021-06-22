<?php declare(strict_types=1);

namespace KuuraCms\Block;

use Pike\AppContext;

final class BlocksModule {
    public function init(AppContext $ctx): void {
        $ctx->router->map('POST', '/api/blocks',
            [BlocksController::class, 'createBlock']
        );
        $ctx->router->map('PUT', '/api/blocks/[w:blockId]',
            [BlocksController::class, 'updateBlock']
        );
    }
}
