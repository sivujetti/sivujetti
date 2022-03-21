<?php declare(strict_types=1);

namespace Sivujetti\Theme;

use Pike\Router;

final class ThemesModule {
    /**
     * @param \Pike\Router $router
     */
    public function init(Router $router): void {
        $router->map("GET", "/api/themes/[i:themeId]/styles",
            [ThemesController::class, "getStyles", ["consumes" => "application/json",
                                                    "identifiedBy" => ["view", "themes"]]],
        );
        $router->map("PUT", "/api/themes/[i:themeId]/styles/block-type/[w:blockTypeName]",
            [ThemesController::class, "updateBlockTypeStyles", ["consumes" => "application/json",
                                                                "identifiedBy" => ["update", "themes"]]],
        );
        $router->map("PUT", "/api/themes/[i:themeId]/styles/global",
            [ThemesController::class, "updateGlobalStyles", ["consumes" => "application/json",
                                                             "identifiedBy" => ["update", "themes"]]],
        );
    }
}
