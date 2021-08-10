<?php declare(strict_types=1);

namespace Sivujetti\Layout;

use Sivujetti\AppContext;

final class LayoutsModule {
    /**
     * @param \Sivujetti\AppContext $ctx
     */
    public function init(AppContext $ctx): void {
        $ctx->router->map("PUT", "/api/layouts/[i:layoutId]/blocks",
            [LayoutsController::class, "updateLayoutBlocks", ["consumes" => "application/json",
                                                              "identifiedBy" => ["updateBlocksOf", "layouts"]]],
        );
    }
}
