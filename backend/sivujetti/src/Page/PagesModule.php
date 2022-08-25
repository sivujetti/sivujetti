<?php declare(strict_types=1);

namespace Sivujetti\Page;

use Pike\Router;

final class PagesModule {
    /**
     * @param \Pike\Router $router
     */
    public function init(Router $router): void {
        $router->map("GET", "/api/_placeholder-page/[w:pageType]/[i:layoutId]",
            [PagesController::class, "renderPlaceholderPage", ["identifiedBy" => ["create", "pages"],
                                                               "allowMissingRequestedWithHeader" => true]]
        );
        $router->map("POST", "/api/pages/[w:pageType]",
            [PagesController::class, "createPage", ["consumes" => "application/json",
                                                    "identifiedBy" => ["create", "pages"]]]
        );
        $router->map("GET", "/api/pages/[w:pageType]",
            [PagesController::class, "listPages", ["identifiedBy" => ["list", "pages"]]]
        );
        $router->map("PUT", "/api/pages/[w:pageType]/[i:pageId]/blocks",
            [PagesController::class, "updatePageBlocks", ["consumes" => "application/json",
                                                          "identifiedBy" => ["updateBlocksOf", "pages"]]]
        );
        $router->map("PUT", "/api/pages/[w:pageType]/[i:pageId]",
            [PagesController::class, "updatePage", ["consumes" => "application/json",
                                                    "identifiedBy" => ["update", "pages"]]]
        );
        $router->map("GET", "/_edit/[**:url]?",
            [PagesController::class, "renderEditAppWrapper", ["identifiedBy" => ["access", "editMode"],
                                                              "allowMissingRequestedWithHeader" => true]]
        );
        $router->map("GET", "/jet-login",
            [PagesController::class, "renderLoginPage", ["allowMissingRequestedWithHeader" => true,
                                                         "skipAuth" => true]]
        );
        $router->map("GET", "/jet-reset-pass",
            [PagesController::class, "renderRequestPassResetPage", ["allowMissingRequestedWithHeader" => true,
                                                                    "skipAuth" => true]]
        );
        $router->map("GET", "[**:url]",
            [PagesController::class, "renderPage", ["allowMissingRequestedWithHeader" => true,
                                                    "skipAuth" => true]]
        );
    }
}
