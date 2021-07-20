<?php declare(strict_types=1);

namespace KuuraCms\Block;

use KuuraCms\AppContext;

final class BlocksModule {
    /**
     * @param \KuuraCms\AppContext $ctx
     */
    public function init(AppContext $ctx): void {
        $ctx->router->map("POST", "/api/blocks/to-page/[i:pageId]/[w:parentBlockId]?",
            [BlocksController::class, "addBlockToPage", ["consumes" => "application/json",
                                                         "identifiedBy" => ["create", "blocks"]]]
        );
    }
}
