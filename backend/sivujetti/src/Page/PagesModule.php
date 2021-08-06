<?php declare(strict_types=1);

namespace Sivujetti\Page;

use Sivujetti\AppContext;

final class PagesModule {
    /**
     * @param \Sivujetti\AppContext $ctx
     */
    public function init(AppContext $ctx): void {
        $ctx->router->map("GET", "/api/_placeholder-page/[w:pageType]/[i:layoutId]",
            [PagesController::class, "renderPlaceholderPage", ["consumes" => "text/html",
                                                               "identifiedBy" => ["create", "pages"]]],
        );
        $ctx->router->map("POST", "/api/pages/[w:pageType]",
            [PagesController::class, "createPage", ["consumes" => "application/json",
                                                    "identifiedBy" => ["create", "pages"]]],
        );
        $ctx->router->map("PUT", "/api/pages/[w:pageType]/[i:pageId]/blocks",
            [PagesController::class, "updatePageBlocks", ["consumes" => "application/json",
                                                          "identifiedBy" => ["updateBlocksOf", "pages"]]],
        );
        $ctx->router->map("GET", "/_edit/[**:url]?",
            [PagesController::class, "renderEditAppWrapper", ["identifiedBy" => ["access", "editMode"]]]
        );
        $ctx->router->map("GET", "[*:url]",
            [PagesController::class, "renderPage"]
        );
    }
}
