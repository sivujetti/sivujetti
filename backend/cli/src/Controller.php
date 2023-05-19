<?php declare(strict_types=1);

namespace Sivujetti\Cli;

use Pike\Auth\Crypto;
use Pike\{FileSystem, PikeException, Request, Response, Validation};
use Sivujetti\App;
use Sivujetti\Installer\LocalDirInstaller;
use Sivujetti\Update\{Signer, ZipPackageStream};
use Sivujetti\ValidationUtils;

final class Controller {
    /**
     * `php cli.php install-from-dir <relDirPath> settings...`: Installs Sivujetti
     * from local directory SIVUJETTI_BACKEND_PATH . "installer/sample-content/
     * {$req->params->relDirPath}/" to SIVUJETTI_BACKEND_PATH . "site".
     */
    public function installCmsFromDir(Request $req,
                                      Response $res,
                                      Crypto $crypto,
                                      LocalDirInstaller $installer): void {
        if ($req->params->relDirPath === "basic-site" && !defined("TEST_CONFIG_DIR_PATH"))
            die("`install-from-dir basic-site` is currently disabled. Use `install-from-dir empty` instead.");
        $config = self::createConfigOrThrow(array_map("urldecode", explode("/", $req->params->settings)), $crypto);
        $installer->doInstall(urldecode($req->params->relDirPath), $config);
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
        $key = self::getSigningKeyAsBin($req->params->signingKey, $signer);
        $outFilePath = SIVUJETTI_BACKEND_PATH . "sivujetti-" . App::VERSION . ".zip";
        $zipContents = $bundler->makeRelease($toPackage, $outFilePath, true);
        $sigFilePath = "{$outFilePath}.sig.txt";
        $this->writeSignatureFile($sigFilePath, $zipContents, $key, $signer, $fs);
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
        $fs->copy(SIVUJETTI_BACKEND_PATH . "cli.php", "{$outDirPath}/backend/cli.php");
        //
        echo "Ok, created release to `{$outDirPath}`";
    }
    /**
     * `php cli.php create-patch to-zip <relPatchContentsMapFile> <secretKey> <sourcePath>`: Creates
     * a patch zip file (that can be used by the updater), writes it to SIVUJETTI_BACKEND_PATH .
     * "<currentVersion>-patch.zip", and its signature to SIVUJETTI_BACKEND_PATH .
     * "<currentVersion>-patch.sig.txt".
     */
    public function createZipPatch(Request $req,
                                    Response $res,
                                    Bundler $bundler,
                                    ZipPackageStream $toPackage,
                                    FileSystem $fs,
                                    Signer $signer): void {
        $key = self::getSigningKeyAsBin($req->params->signingKey, $signer);
        $pcs = explode("_", $req->params->relPatchContentsMapFile);
        if (count($pcs) !== 2) throw new PikeException("relPatchContentsMapFile must be formatted as patch-target-patchname.json");
        ValidationUtils::checkIfValidaPathOrThrow($pcs[0], true);
        $outFilePath = SIVUJETTI_BACKEND_PATH . "{$pcs[0]}-" . App::VERSION . ".zip";
        if ($req->params->sourcePath !== "-")
            $bundler->setSourceDir(urldecode($req->params->sourcePath));
        $zipContents = $bundler->makePatch($toPackage, $outFilePath, $req->params->relPatchContentsMapFile, true);
        $sigFilePath = "{$outFilePath}.sig.txt";
        $this->writeSignatureFile($sigFilePath, $zipContents, $key, $signer, $fs);
        $res->plain("Ok, created release to `{$outFilePath}`, and signature to `{$sigFilePath}`");
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
     *
     * @param string[] $args
     * @param \Pike\Auth\Crypto $crypto
     * @return array{db.driver: string, db.database: string, db.host?: string, db.user?: string, db.pass?: string, db.tablePrefix?: string, db.charset?: string, baseUrl: string, mainQueryVar: string, secret: string, initialUserId: string, initialUserUsername: string, initialUserEmail: string, initialUserPasswordHash: string, flags: string}
     * @throws \Pike\PikeException
     */
    public static function createConfigOrThrow(array $vals, Crypto $crypto): array {
        if (count($vals) < 3)
            throw new PikeException("Expected at least 3 arguments (<username> <email> <password>)",
                                    PikeException::BAD_INPUT);
        $dbDetails = explode(":", $vals[3] ?? "-", 2);
        $dbDataBase = $vals[4] ?? "-";
        $dbUser = $vals[5] ?? "-";
        $dbPass = $vals[6] ?? "-";
        $baseUrl = $vals[7] ?? "-";
        $input = (object) [
            "username"   => $vals[0],
            "email"      => $vals[1],
            "password"   => $vals[2],
            "dbDriver"   => $dbDetails[0] !== "-" ? $dbDetails[0] : "sqlite",
            "dbHost"     => $dbDetails[1] ?? "127.0.0.1",
            "dbDatabase" => $dbDataBase !== "-" ? $dbDataBase : "",
            "dbUser"     => $dbUser !== "-" ? $dbUser : "",
            "dbPass"     => $dbPass !== "-" ? $dbPass : "",
            "baseUrl"    => $baseUrl !== "-" ? $baseUrl : "/",
        ];
        $v = Validation::makeObjectValidator()
            ->rule("username", "minLength", 2)
            ->rule("email", "regexp", ValidationUtils::EMAIL_REGEXP_SIMPLE)
            ->rule("password", "minLength", 8)
            ->rule("baseUrl", "type", "string");
        $useSqlite = $input->dbDriver === "sqlite";
        if (!$useSqlite) {
            $v->rule("dbDriver", "in", ["sqlite", "mysql"])
            ->rule("dbHost", "type", "string")
            ->rule("dbDatabase", "identifier")
            ->rule("dbDatabase", "minLength", 1)
            ->rule("dbUser", "minLength", 1)
            ->rule("dbPass", "type", "string");
        }
        if (($errors = $v->validate($input))) {
            throw new PikeException(implode(PHP_EOL, $errors),
                                    PikeException::BAD_INPUT);
        }
        return array_merge([
            "db.driver" => $input->dbDriver,
        ], $useSqlite ? [
            "db.database" => "\${SIVUJETTI_BACKEND_PATH}site/my-site.db"
        ] : [
            "db.host"        => $input->dbHost,
            "db.database"    => $input->dbDatabase,
            "db.user"        => $input->dbUser,
            "db.pass"        => $input->dbPass,
            "db.tablePrefix" => "",
            "db.charset"     => "utf8mb4",
        ], [
            "baseUrl" => $input->baseUrl,
            "mainQueryVar" => "q",
            "secret" => $crypto->genRandomToken(),
            "initialUserId" => $crypto->guidv4(),
            "initialUserUsername" => $input->username,
            "initialUserEmail" => $input->email,
            "initialUserPasswordHash" => $crypto->hashPass($input->password),
            "flags" => "SIVUJETTI_DEVMODE",
        ]);
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
    /**
     * @param string $key $req->params->signingKey
     * @param \Sivujetti\Update\Signer $signer
     * @return string hex2bin($key)
     */
    private static function getSigningKeyAsBin(string $key, Signer $signer): string {
        $SIGNING_KEY_LEN = SODIUM_CRYPTO_SIGN_SECRETKEYBYTES;
        $asBin = $signer->hex2bin($key);
        if (strlen($asBin ?? "") !== $SIGNING_KEY_LEN)
            throw new PikeException("\$params->signingKey must be SODIUM_CRYPTO_SIGN_SECRETKEYBYTES bytes long",
                                    PikeException::BAD_INPUT);
        return $asBin;
    }
}
