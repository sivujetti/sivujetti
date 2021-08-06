<?php declare(strict_types=1);

namespace KuuraCms\Cli;

use KuuraCms\Installer\LocalDirInstaller;
use Pike\{Request, Response};

final class Controller {
    /**
     * `php cli.php install-from-dir <relDirPath> <baseUrl>?`: Installs KuuraCms
     * from local directory KUURA_BACKEND_PATH . "installer/sample-content/
     * {$req->params->relDirPath}/" to KUURA_BACKEND_PATH . "site".
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \KuuraCms\Installer\LocalDirInstaller $installer
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
        $fn = require KUURA_BACKEND_PATH . "installer/default-acl-rules.php";
        $res->json($fn());
    }
}
