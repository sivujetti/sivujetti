<?php declare(strict_types=1);

namespace Sivujetti\Cli;

use Sivujetti\AppContext;

final class Module {
    /**
     * Registers routes for the Sivujetti CLI application, cli.php.
     *
     * @param \Sivujetti\AppContext $ctx
     */
    public function init(AppContext $ctx): void {
        $ctx->router->map("PSEUDO:CLI", "/install-from-dir/[*:relDirPath]/[**:settings]",
            [Controller::class, "installCmsFromDir"]
        );
        $ctx->router->map("PSEUDO:CLI", "/generate-signing-keypair",
            [Controller::class, "createSigningKeyPair"]
        );
        $ctx->router->map("PSEUDO:CLI", "/create-release/to-zip/[*:signingKey]?",
            [Controller::class, "createZipRelease"]
        );
        $ctx->router->map("PSEUDO:CLI", "/create-release/to-local-dir",
            [Controller::class, "createGithubRelease"]
        );
        $ctx->router->map("PSEUDO:CLI", "/print-acl-rules",
            [Controller::class, "printAclRules"]
        );
    }
}
