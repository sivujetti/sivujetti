<?php declare(strict_types=1);

namespace Sivujetti\Cli;

use Pike\{FileSystem, PikeException, Request, Response};
use Sivujetti\App;
use Sivujetti\Installer\{LocalDirInstaller};
use Sivujetti\Update\ZipPackageStream;

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
        $res->json((object) ["ok" => "ok"]);
    }
    /**
     * `php cli.php generate-signing-keypair`: creates {secretKey: <hexEncodedKey>,
     * publicKey: <hexEncodedKey>} and prints it to the cli output.
     */
    public function createSigningKeyPair(Response $res, Crypto $crypto): void {
        $keyPair = $crypto->generateSigningKeyPair();
        $res->json((object) [
            "secretKey" => $crypto->bin2hex($keyPair->secretKey),
            "publicKey" => $crypto->bin2hex($keyPair->publicKey),
        ]);
    }
    /**
     * `php cli.php create-release to-zip <secretKey>`: Creates a standalone zip
     * file (that can be used by the updater), writes it to SIVUJETTI_BACKEND_PATH .
     * "<currentVersion>.zip", and its signature to SIVUJETTI_BACKEND_PATH .
     * "<currentVersion>.sig.txt".
     */
    public function createZipRelease(Request $req,
                                     Response $res,
                                     Bundler $bundler,
                                     ZipPackageStream $toPackage,
                                     FileSystem $fs,
                                     Crypto $crypto): void {
        $SIGNING_KEY_LEN = SODIUM_CRYPTO_SIGN_SECRETKEYBYTES;
        if (strlen($req->params->signingKey ?? "") !== $SIGNING_KEY_LEN)
            throw new PikeException("\$params->signingKey must be SODIUM_CRYPTO_SIGN_SECRETKEYBYTES bytes long",
                                    PikeException::BAD_INPUT);
        $outFilePath = SIVUJETTI_BACKEND_PATH . App::VERSION . ".zip";
        $zipContents = $bundler->makeRelease($toPackage, $outFilePath);
        $sigFilePath = "{$outFilePath}.sig.txt";
        $this->writeSignatureFile($sigFilePath, $zipContents, $req->params->signingKey, $crypto, $fs);
        $res->plain("Ok, created release to `{$outFilePath}`, and signature to `$sigFilePath`");
    }
    /**
     * `php cli.php create-release to-local-dir`.
     *
     * @param \Pike\Response $res
     */
    public function createGithubRelease(): void {
        // todo
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
    /**
     * Signs $fileContents with $secretKey and writes the signature to $filePath
     * (as hex-encoded).
     */
    private static function writeSignatureFile(string $filePath,
                                               string $fileContents,
                                               string $secretKey,
                                               Crypto $crypto,
                                               FileSystem $fs): void {
        $signature = $crypto->sign($fileContents, $secretKey);
        if (!$fs->write($filePath, $crypto->bin2hex($signature)))
            throw new PikeException("Failed to write signature to `{$filePath}`",
                                    PikeException::FAILED_FS_OP);
    }
}
