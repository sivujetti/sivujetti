<?php declare(strict_types=1);

namespace Sivujetti\ReusableBranch;

use Pike\Router;

final class ReusableBranchesModule {
    /**
     * @param \Pike\Router $router
     */
    public function init(Router $router): void {
        $router->map("POST", "/api/reusable-branches",
            [ReusableBranchesController::class, "upsert", ["consumes" => "application/json",
                                                            "identifiedBy" => ["create", "reusableBranches"]]]
        );
        $router->map("GET", "/api/reusable-branches",
            [ReusableBranchesController::class, "list", ["consumes" => "application/json",
                                                        "identifiedBy" => ["list", "reusableBranches"]]]
        );
    }
}
