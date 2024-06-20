<?php declare(strict_types=1);

namespace Sivujetti\PageType;

use Pike\Router;

final class PageTypesModule {
    /**
     * @param \Pike\Router $router
     */
    public function init(Router $router): void {
        $router->map("POST", "/api/page-types/[as-placeholder:asPlaceholder]?",
            [PageTypesController::class, "createPageType", ["consumes" => "application/json",
                                                            "identifiedBy" => ["create", "pageTypes"]]],
        );
        $router->map("PUT", "/api/page-types/[w:name]/[as-placeholder:asPlaceholder]?",
            [PageTypesController::class, "updatePageType", ["consumes" => "application/json",
                                                            "identifiedBy" => ["update", "pageTypes"]]],
        );
        $router->map("DELETE", "/api/page-types/[w:name]/[as-placeholder:asPlaceholder]?",
            [PageTypesController::class, "deletePageType", ["consumes" => "application/json",
                                                            "identifiedBy" => ["delete", "pageTypes"]]],
        );
    }
}
