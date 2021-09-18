<?php declare(strict_types=1);

namespace Sivujetti\Update;

use Sivujetti\AppContext;

final class UpdatesModule {
    /**
     * @param \Sivujetti\AppContext $ctx
     */
    public function init(AppContext $ctx): void {
        $ctx->router->map("PUT", "/api/updates/core",
            [UpdatesController::class, "tryToUpdateCore", ["consumes" => "application/json",
                                                           "identifiedBy" => ["install", "coreUpdates"]]]
        );
    }
}
