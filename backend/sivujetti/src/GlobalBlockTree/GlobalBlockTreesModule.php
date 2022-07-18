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
        $router->map("GET", "/api/global-block-trees/[w:globalBlockTreeId]",
            [GlobalBlockTreesController::class, "getById", ["consumes" => "application/json",
                                                            "identifiedBy" => ["read", "globalBlockTrees"]]]
        );
        $router->map("GET", "/api/global-block-trees",
            [GlobalBlockTreesController::class, "list", ["consumes" => "application/json",
                                                         "identifiedBy" => ["read", "globalBlockTrees"]]]
        );
        $router->map("PUT", "/api/global-block-trees/[w:globalBlockTreeId]/blocks",
            [GlobalBlockTreesController::class, "updateBlocks", ["consumes" => "application/json",
                                                                 "identifiedBy" => ["updateBlocksOf", "globalBlockTrees"]]]
        );
        $router->map("PUT", "/api/global-block-trees/[w:globalBlockTreeId]/block-styles/[i:themeId]",
            [GlobalBlockTreesController::class, "upsertStyles", ["consumes" => "application/json",
                                                                 "identifiedBy" => ["upsertStylesOf", "globalBlockTrees"]]]
        );
    }
}
