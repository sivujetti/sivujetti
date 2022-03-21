<?php declare(strict_types=1);

namespace Sivujetti\Layout;

use Pike\Router;

final class LayoutsModule {
    /**
     * @param \Pike\Router $router
     */
    public function init(Router $router): void {
        $router->map("GET", "/api/layouts",
            [LayoutsController::class, "list", ["consumes" => "application/json",
                                                "identifiedBy" => ["list", "layouts"]]],
        );
        $router->map("PUT", "/api/layouts/[i:layoutId]/structure",
            [LayoutsController::class, "updateLayoutStructure", ["consumes" => "application/json",
                                                                 "identifiedBy" => ["updateStructureOf", "layouts"]]],
        );
    }
}
