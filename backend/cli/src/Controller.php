<?php declare(strict_types=1);

namespace Sivujetti\Cli;

use Sivujetti\Installer\LocalDirInstaller;
use Pike\{Request, Response};

final class Controller {
    /**
     * `php cli.php install-from-dir <relDirPath> <baseUrl>?`: Installs Sivujetti
     * from local directory SIVUJETTI_BACKEND_PATH . "installer/sample-content/
     * {$req->params->relDirPath}/" to SIVUJETTI_BACKEND_PATH . "site".
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Installer\LocalDirInstaller $installer
     */
    public function installCmsFromDir(Request $req,
                                      Response $res,
                                      LocalDirInstaller $installer): void {
        $installer->doInstall(urldecode($req->params->relDirPath),
                              urldecode($req->params->baseUrl ?? "/"));
        $res->json((object) ['ok' => 'ok']);
    }
    /**
     * `php cli.php print-acl-rules`.
     *
     * @param \Pike\Response $res
     */
    public function printAclRules(Response $res): void {
        $fn = require SIVUJETTI_BACKEND_PATH . "installer/default-acl-rules.php";
        $res->json($fn());
    }
}
