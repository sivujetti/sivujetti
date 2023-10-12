<?php declare(strict_types=1);

namespace Sivujetti\Update;

use Pike\Router;

final class UpdatesModule {
    /**
     * @param \Pike\Router $router
     */
    public function init(Router $router): void {
        $router->map("PUT", "/api/updates/begin",
            [UpdatesController::class, "beginUpdates", ["consumes" => "application/json",
                                                        "identifiedBy" => ["install", "coreUpdates"]]]
        );
        $router->map("POST", "/api/updates/[*:packageName]/download",
            [UpdatesController::class, "downloadUpdate", ["consumes" => "application/json",
                                                          "identifiedBy" => ["install", "coreUpdates"]]]
        );
        $router->map("PUT", "/api/updates/[*:packageName]/install",
            [UpdatesController::class, "installUpdate", ["consumes" => "application/json",
                                                         "identifiedBy" => ["install", "coreUpdates"]]]
        );
        $router->map("PUT", "/api/updates/finish",
            [UpdatesController::class, "finishUpdates", ["consumes" => "application/json",
                                                         "identifiedBy" => ["install", "coreUpdates"]]]
        );
        $router->map("PUT", "/api/updates/[w:what]",
            [UpdatesController::class, "tryToUpdate", ["consumes" => "application/json",
                                                       "identifiedBy" => ["install", "coreUpdates"]]]
        );
    }
}
