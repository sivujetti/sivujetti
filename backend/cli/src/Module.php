<?php declare(strict_types=1);

namespace KuuraCms\Cli;

use KuuraCms\AppContext;

final class Module {
    /**
     * Registers routes for cli.php application
     *
     * @param \KuuraCms\AppContext $ctx
     */
    public function init(AppContext $ctx): void {
        $ctx->router->map('PSEUDO:CLI', '/install-from-dir/[*:relDirPath]',
            [Controller::class, 'installCmsFromDir', false]
        );
    }
}
