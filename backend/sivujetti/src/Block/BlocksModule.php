<?php declare(strict_types=1);

namespace Sivujetti\Block;

use Pike\Router;

final class BlocksModule {
    /**
     * @param \Pike\Router $router
     */
    public function init(Router $router): void {
        $router->map("POST", "/api/blocks/render",
            [BlocksController::class, "render", ["consumes" => "application/json",
                                                 "identifiedBy" => ["renderOrView", "blocks"]]]
        );
        $router->map("GET", "/api/blocks/[w:type]",
            [BlocksController::class, "list", ["consumes" => "application/json",
                                               "identifiedBy" => ["renderOrView", "blocks"]]]
        );
    }
}
