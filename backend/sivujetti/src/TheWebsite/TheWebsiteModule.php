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
    }
}
