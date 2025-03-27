<?php declare(strict_types=1);

namespace Sivujetti\TheWebsite;

use Pike\Router;

final class TheWebsiteModule {
    /**
     * @param \Pike\Router $router
     */
    public function init(Router $router): void {
        $router->map("PUT", "/api/the-website/basic-info",
            [TheWebsiteController::class, "saveBasicInfo", ["consumes" => "application/json",
                                                            "identifiedBy" => ["updateBasicInfoOf", "theWebsite"]]]
        );
        $router->map("PUT", "/api/the-website/global-scripts",
            [TheWebsiteController::class, "saveGlobalScripts", ["consumes" => "application/json",
                                                                "identifiedBy" => ["updateBasicInfoOf", "theWebsite"]]]
        );
        $router->map("POST", "/api/the-website/export",
            [TheWebsiteController::class, "export", ["consumes" => "application/json",
                                                     "identifiedBy" => ["export", "theWebsite"]]]
        );
        $router->map("GET", "/api/the-website/issues",
            [TheWebsiteController::class, "getSecurityAndOtherIssues", ["consumes" => "application/json",
                                                                        "identifiedBy" => ["checkHealthOf", "theWebsite"]]]
        );
        $router->map("GET", "/api/the-website/do-heartbeat",
            [TheWebsiteController::class, "doHeartbeat", ["consumes" => "application/json",
                                                          "identifiedBy" => ["doHeartbeat", "theWebsite"]]]
        );
    }
}
