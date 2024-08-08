<?php declare(strict_types=1);

namespace Sivujetti\ContentTemplate;

use Pike\Router;

final class ContentTemplatesModule {
    /**
     * @param \Pike\Router $router
     */
    public function init(Router $router): void {
        $router->map("GET", "/api/content-templates",
            [ContentTemplatesController::class, "list", ["consumes" => "application/json",
                                                         "identifiedBy" => ["list", "contentTemplates"]]]
        );
    }
}
