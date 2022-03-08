<?php declare(strict_types=1);

namespace Sivujetti\Theme;

use Sivujetti\AppContext;

final class ThemesModule {
    /**
     * @param \Sivujetti\AppContext $ctx
     */
    public function init(AppContext $ctx): void {
        $ctx->router->map("GET", "/api/themes/[i:themeId]/styles",
            [ThemesController::class, "getStyles", ["consumes" => "application/json",
                                                    "identifiedBy" => ["view", "themes"]]],
        );
    }
}
