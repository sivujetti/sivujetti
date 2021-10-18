<?php declare(strict_types=1);

namespace Sivujetti\Layout;

use Sivujetti\AppContext;

final class LayoutsModule {
    /**
     * @param \Sivujetti\AppContext $ctx
     */
    public function init(AppContext $ctx): void {
        $ctx->router->map("GET", "/api/layouts",
            [LayoutsController::class, "list", ["consumes" => "application/json",
                                                "identifiedBy" => ["list", "layouts"]]],
        );
        $ctx->router->map("PUT", "/api/layouts/[i:layoutId]/structure",
            [LayoutsController::class, "updateLayoutStructure", ["consumes" => "application/json",
                                                                 "identifiedBy" => ["updateStructureOf", "layouts"]]],
        );
    }
}
