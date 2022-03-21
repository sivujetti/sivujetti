<?php declare(strict_types=1);

namespace Sivujetti\Upload;

use Pike\Router;

final class UploadsModule {
    /**
     * @param \Pike\Router $router
     */
    public function init(Router $router): void {
        $router->map("GET", "/api/uploads/[*:filters]?",
            [UploadsController::class, "getUploads", ["consumes" => "application/json",
                                                      "identifiedBy" => ["view", "uploads"]]]
        );
        $router->map("POST", "/api/uploads",
            [UploadsController::class, "uploadFile", ["consumes" => "multipart/form-data",
                                                      "identifiedBy" => ["upload", "uploads"]]]
        );
    }
}
