<?php declare(strict_types=1);

namespace Sivujetti\GlobalBlockTree;

use Sivujetti\AppContext;

final class GlobalBlockTreesModule {
    /**
     * @param \Sivujetti\AppContext $ctx
     */
    public function init(AppContext $ctx): void {
        $ctx->router->map("POST", "/api/global-block-trees",
            [GlobalBlockTreesController::class, "create", ["consumes" => "application/json",
                                                           "identifiedBy" => ["create", "globalBlockTrees"]]]
        );
        $ctx->router->map("GET", "/api/global-block-trees",
            [GlobalBlockTreesController::class, "list", ["consumes" => "application/json",
                                                         "identifiedBy" => ["list", "globalBlockTrees"]]]
        );
        $ctx->router->map("PUT", "/api/global-block-trees/[i:globalBlockTreeId]/blocks",
            [GlobalBlockTreesController::class, "update", ["consumes" => "application/json",
                                                           "identifiedBy" => ["update", "globalBlockTrees"]]]
        );
    }
}
