<?php declare(strict_types=1);

namespace Sivujetti\Update;

use Pike\Router;

final class UpdatesModule {
    /**
     * @param \Pike\Router $router
     */
    public function init(Router $router): void {
        $router->map("PUT", "/api/updates/[w:what]",
            [UpdatesController::class, "tryToUpdate", ["consumes" => "application/json",
                                                       "identifiedBy" => ["install", "coreUpdates"]]]
        );
    }
}
