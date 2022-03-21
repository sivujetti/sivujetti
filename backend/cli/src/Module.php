<?php declare(strict_types=1);

namespace Sivujetti\Cli;

use Pike\Router;

final class Module {
    /**
     * Registers routes for the Sivujetti CLI application, cli.php.
     *
     * @param \Pike\Router $router
     */
    public function init(Router $router): void {
        $router->map("PSEUDO:CLI", "/install-from-dir/[*:relDirPath]/[**:settings]",
            [Controller::class, "installCmsFromDir"]
        );
        $router->map("PSEUDO:CLI", "/generate-signing-keypair",
            [Controller::class, "createSigningKeyPair"]
        );
        $router->map("PSEUDO:CLI", "/create-release/to-zip/[*:signingKey]?",
            [Controller::class, "createZipRelease"]
        );
        $router->map("PSEUDO:CLI", "/create-release/to-local-dir",
            [Controller::class, "createGithubRelease"]
        );
        $router->map("PSEUDO:CLI", "/print-acl-rules",
            [Controller::class, "printAclRules"]
        );
    }
}
