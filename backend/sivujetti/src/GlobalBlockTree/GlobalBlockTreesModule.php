<?php declare(strict_types=1);

namespace Sivujetti\GlobalBlockTree;

use Pike\Router;

final class GlobalBlockTreesModule {
    /**
     * @param \Pike\Router $router
     */
    public function init(Router $router): void {
        $router->map("POST", "/api/global-block-trees",
            [GlobalBlockTreesController::class, "create", ["consumes" => "application/json",
                                                           "identifiedBy" => ["create", "globalBlockTrees"]]]
        );
        $router->map("GET", "/api/global-block-trees/[i:globalBlockTreeId]",
            [GlobalBlockTreesController::class, "getById", ["consumes" => "application/json",
                                                            "identifiedBy" => ["read", "globalBlockTrees"]]]
        );
        $router->map("GET", "/api/global-block-trees",
            [GlobalBlockTreesController::class, "list", ["consumes" => "application/json",
                                                         "identifiedBy" => ["read", "globalBlockTrees"]]]
        );
        $router->map("PUT", "/api/global-block-trees/[i:globalBlockTreeId]/blocks",
            [GlobalBlockTreesController::class, "update", ["consumes" => "application/json",
                                                           "identifiedBy" => ["update", "globalBlockTrees"]]]
        );
        $router->map("PUT", "/api/global-block-trees/[i:globalBlockTreeId]/block-styles/[i:themeId]",
            [GlobalBlockTreesController::class, "updateOrCreateStyles", ["consumes" => "application/json",
                                                                         "identifiedBy" => ["updateStylesOf", "globalBlockTrees"]]]
        );
    }
}
