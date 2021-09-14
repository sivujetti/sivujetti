<?php declare(strict_types=1);

namespace Sivujetti\Upload;

use Sivujetti\AppContext;

final class UploadsModule {
    /**
     * @param \Sivujetti\AppContext $ctx
     */
    public function init(AppContext $ctx): void {
        $ctx->router->map("GET", "/api/uploads/[*:filters]?",
            [UploadsController::class, "getUploads", ["consumes" => "application/json",
                                                      "identifiedBy" => ["view", "uploads"]]]
        );
    }
}
