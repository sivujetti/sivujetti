<?php declare(strict_types=1);

namespace Sivujetti\Block;

use Sivujetti\AppContext;

final class BlocksModule {
    /**
     * @param \Sivujetti\AppContext $ctx
     */
    public function init(AppContext $ctx): void {
        $ctx->router->map("POST", "/api/blocks/render",
            [BlocksController::class, "render", ["consumes" => "application/json",
                                                 "identifiedBy" => ["render", "blocks"]]]
        );
    }
}
