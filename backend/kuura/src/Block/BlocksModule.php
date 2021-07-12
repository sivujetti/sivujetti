<?php declare(strict_types=1);

namespace KuuraCms\Block;

use KuuraCms\AppContext;

final class BlocksModule {
    /**
     * @param \KuuraCms\AppContext $ctx
     */
    public function init(AppContext $ctx): void {
        $ctx->router->map("POST", "/api/blocks/to-page",
            [BlocksController::class, "addBlockToPage", "consumes=json&identifiedBy=create:blocks"]
        );
    }
}
