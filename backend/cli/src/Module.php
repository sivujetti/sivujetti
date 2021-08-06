<?php declare(strict_types=1);

namespace Sivujetti\Cli;

use Sivujetti\AppContext;

final class Module {
    /**
     * Registers routes for cli.php application
     *
     * @param \Sivujetti\AppContext $ctx
     */
    public function init(AppContext $ctx): void {
        $ctx->router->map("PSEUDO:CLI", "/install-from-dir/[*:relDirPath]/[*:baseUrl]?",
            [Controller::class, "installCmsFromDir"]
        );
        $ctx->router->map("PSEUDO:CLI", "/print-acl-rules",
            [Controller::class, "printAclRules"]
        );
    }
}
