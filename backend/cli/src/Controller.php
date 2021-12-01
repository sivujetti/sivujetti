<?php declare(strict_types=1);

namespace Sivujetti\Cli;

use Pike\{FileSystem, PikeException, Request, Response};
use Sivujetti\App;
use Sivujetti\FileSystem as SivujettiFileSystem;
use Sivujetti\Installer\{LocalDirInstaller};
use Sivujetti\Update\{Signer, ZipPackageStream};

final class Controller {
    /**
     * `php cli.php install-from-dir <relDirPath> <baseUrl>?`: Installs Sivujetti
     * from local directory SIVUJETTI_BACKEND_PATH . "installer/sample-content/
     * {$req->params->relDirPath}/" to SIVUJETTI_BACKEND_PATH . "site".
     */
    public function installCmsFromDir(Request $req,
                                      Response $res,
                                      LocalDirInstaller $installer): void {
        $installer->doInstall(urldecode($req->params->relDirPath),
                              urldecode($req->params->baseUrl ?? "/"));
        $res->json(["ok" => "ok"]);
    }
    /**
     * `php cli.php generate-signing-keypair`: creates {secretKey: <hexEncodedKey>,
     * publicKey: <hexEncodedKey>} and prints it to the cli output.
     */
    public function createSigningKeyPair(Response $res, Signer $signer): void {
        $keyPair = $signer->generateSigningKeyPair();
        $res->json([
            "secretKey" => $signer->bin2hex($keyPair->secretKey),
            "publicKey" => $signer->bin2hex($keyPair->publicKey),
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
                                     Signer $signer): void {
        $SIGNING_KEY_LEN = SODIUM_CRYPTO_SIGN_SECRETKEYBYTES;
        $req->params->signingKey = $signer->hex2bin($req->params->signingKey);
        if (strlen($req->params->signingKey ?? "") !== $SIGNING_KEY_LEN)
            throw new PikeException("\$params->signingKey must be SODIUM_CRYPTO_SIGN_SECRETKEYBYTES bytes long",
                                    PikeException::BAD_INPUT);
        $outFilePath = SIVUJETTI_BACKEND_PATH . "sivujetti-" . App::VERSION . ".zip";
        $zipContents = $bundler->makeRelease($toPackage, $outFilePath, true);
        $sigFilePath = "{$outFilePath}.sig.txt";
        $this->writeSignatureFile($sigFilePath, $zipContents, $req->params->signingKey, $signer, $fs);
        $res->plain("Ok, created release to `{$outFilePath}`, and signature to `{$sigFilePath}`");
    }
    /**
     * `php cli.php create-release to-local-dir`.
     */
    public function createGithubRelease(Bundler $bundler,
                                        ZipPackageStream $toPackage): void {
        $fs = new FileSystem;
        $tempDirPath = SIVUJETTI_BACKEND_PATH . "sivujetti-" . App::VERSION . "-tmp";
        if ($fs->isDir($tempDirPath))
            throw new \Exception("Please remove previous release ({$tempDirPath}) first.");
        $fs->mkDir($tempDirPath);
        //
        $zipFilePath = $bundler->makeRelease($toPackage, "@createTemp", resultFlags: ZipPackageStream::FLAG_AS_PATH);
        $read = new ZipPackageStream($fs);
        $read->open($zipFilePath);
        //
        $ALL_FILES = null;
        $read->extractMany($tempDirPath, $ALL_FILES);
        //
        $outDirPath = "{$tempDirPath}/final";
        // $index/index.php etc. -> final/index.php
        $fs->move("{$tempDirPath}/\$index", $outDirPath);
        // $backend/* etc -> final/backend/*
        $fs->move("{$tempDirPath}/\$backend", "{$outDirPath}/backend");
        $fs->copy("{$outDirPath}/backend/installer/sample-content/basic-site/config.in.sample.php",
                  "{$outDirPath}/backend/installer/sample-content/basic-site/config.in.php");
        $fs->copy("{$outDirPath}/backend/installer/sample-content/empty/config.in.sample.php",
                  "{$outDirPath}/backend/installer/sample-content/empty/config.in.php");
        $fs->copy(SIVUJETTI_BACKEND_PATH . "cli.php", "{$outDirPath}/backend/cli.php");
        //
        echo "Ok, created release to `{$outDirPath}`";
    }
    /**
     * `php cli.php print-acl-rules`.
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
                                               Signer $signer,
                                               FileSystem $fs): void {
        $signature = $signer->sign($fileContents, $secretKey);
        if (!$fs->write($filePath, $signer->bin2hex($signature)))
            throw new PikeException("Failed to write signature to `{$filePath}`",
                                    PikeException::FAILED_FS_OP);
    }
}
