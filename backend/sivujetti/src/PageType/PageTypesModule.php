<?php declare(strict_types=1);

namespace Sivujetti\PageType;

use Sivujetti\AppContext;

final class PageTypesModule {
    /**
     * @param \Sivujetti\AppContext $ctx
     */
    public function init(AppContext $ctx): void {
        $ctx->router->map("POST", "/api/page-types",
            [PageTypesController::class, "createPageType", ["consumes" => "application/json",
                                                            "identifiedBy" => ["create", "pageTypes"]]],
        );
    }
}
