<?php declare(strict_types=1);

namespace KuuraCms\Installer;

use KuuraCms\AppContext;

final class Module {
    /**
     * Registers routes for install.php?q=*
     *
     * @param \Pike\AppContext $ctx
     */
    public function init(AppContext $ctx): void {
        $ctx->router->map('POST', '/from-dir',
            [Controller::class, 'installFromDir', false]
        );
    }
}
