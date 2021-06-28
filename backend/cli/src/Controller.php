<?php declare(strict_types=1);

namespace KuuraCms\Cli;

use KuuraCms\Installer\LocalDirInstaller;
use Pike\{Request, Response};

final class Controller {
    /**
     * Installs KuuraCms from local directory KUURA_BACKEND_PATH . "installer/
     * sample-content/{$req->params->relDirPath}/" to KUURA_BACKEND_PATH . "site".
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \KuuraCms\Installer\LocalDirInstaller $installer
     */
    public function installCmsFromDir(Request $req,
                                      Response $res,
                                      LocalDirInstaller $installer): void {
        $installer->doInstall(urldecode($req->params->relDirPath));
        $res->json((object) ['ok' => 'ok']);
    }
}
