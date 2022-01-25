<?php declare(strict_types=1);

namespace Sivujetti\PageType;

use Sivujetti\AppContext;

final class PageTypesModule {
    /**
     * @param \Sivujetti\AppContext $ctx
     */
    public function init(AppContext $ctx): void {
        $ctx->router->map("POST", "/api/page-types/as-placeholder",
            [PageTypesController::class, "createPlaceholderPageType", ["consumes" => "application/json",
                                                                       "identifiedBy" => ["create", "pageTypes"]]],
        );
        $ctx->router->map("PUT", "/api/page-types/[w:name]/[as-placeholder:asPlaceholder]?",
            [PageTypesController::class, "updatePlaceholderPageType", ["consumes" => "application/json",
                                                                       "identifiedBy" => ["update", "pageTypes"]]],
        );
    }
}
