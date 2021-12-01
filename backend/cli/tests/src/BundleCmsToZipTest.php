<?php declare(strict_types=1);

namespace Sivujetti\Cli\Tests;

use Sivujetti\Cli\App;
use Pike\{FileSystem, Request};
use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\Cli\Bundler;
use Sivujetti\Update\{PackageStreamInterface as Pkg, Updater, ZipPackageStream};

final class BundleCmsToZipTest extends DbTestCase {
    use HttpTestUtils;
    private string $actuallyWrittenZipFilePath;
    private string $actuallyWrittenSignatureFilePath;
    private const FILES_GENERATED_BY_COMPOSER = [
        "vendor/autoload.php" => "<?php // mock composer-generated autoload.php"
    ];
    private const FILES_GENERATED_BY_JS_BUNDLER = [
        "sivujetti-edit-app.js" => "bundled js here",
    ];
    protected function setUp(): void {
        parent::setUp();
        $this->actuallyWrittenZipFilePath = "";
        $this->actuallyWrittenSignatureFilePath = "";
    }
    protected function tearDown(): void {
        parent::tearDown();
        if ($this->actuallyWrittenZipFilePath) unlink($this->actuallyWrittenZipFilePath);
        if ($this->actuallyWrittenSignatureFilePath) unlink($this->actuallyWrittenSignatureFilePath);
    }
    public function testCreateZipReleaseBundlesEverythingToZipFile(): void {
        $state = $this->setupTest();
        $this->makeTestCliApp($state);
        $this->invokeCreateZipReleaseFeature($state);
        $this->verifyReturnedSuccesfully($state);
        $this->verifyWroteZipAndSignatureFilesToTargetDir($state);
        $this->verifyIncludedBackendFilesToZip($state);
        $this->verifyIncludedPublicFilesToZip($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->inputData = (object) [
            // $signer->hex2bin($signer->generateSigningKeyPair()->secretKey)
            "secretKey" => "17c31ad9c358901e0c3364025ddae226dbd95fd130bf85eac802a29e9d363bdef636a6df9e68639e6594a1f3a412fb3479b1cebb62460d96464e5cbcc66d38d6"
        ];
        $state->cliApp = null;
        $state->actuallyWrittenZipFilePath = null;
        $state->actuallyWrittenSignatureFilePath = null;
        $state->spyingResponse = null;
        return $state;
    }
    private function makeTestCliApp(\TestState $state): void {
        $state->cliApp = $this->makeApp(fn() => App::create(self::setGetConfig()), function ($di) {
            $di->define(Bundler::class, [
                ":printFn" => function () { },
                ":shellExecFn" => function ($cmd) {
                    $composerTmpPath = SIVUJETTI_BACKEND_PATH . "bundler-temp/";
                    $npmTmpPath = SIVUJETTI_PUBLIC_PATH . "public/bundler-temp/public/sivujetti";
                    if ($cmd === "composer install --no-dev --optimize-autoloader") {
                        mkdir("{$composerTmpPath}vendor", 0755);
                        foreach (self::FILES_GENERATED_BY_COMPOSER as $mockFilePath => $mockContents)
                            file_put_contents("{$composerTmpPath}{$mockFilePath}", $mockContents);
                    } elseif ($cmd === "npm --prefix " . SIVUJETTI_PUBLIC_PATH . " run-script build -- " .
                                       "--configBundle all --configTargetRelDir public/bundler-temp/public/sivujetti/") {
                        foreach (self::FILES_GENERATED_BY_JS_BUNDLER as $mockFilePath => $mockContents)
                            file_put_contents("{$npmTmpPath}/{$mockFilePath}", $mockContents);
                    }
                }
            ]);
        });
    }
    private function invokeCreateZipReleaseFeature(\TestState $state): void {
        $state->spyingResponse = $state->cliApp->sendRequest(
            new Request("/create-release/to-zip/{$state->inputData->secretKey}", "PSEUDO:CLI"));
    }
    private function verifyReturnedSuccesfully(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "text/plain", $state->spyingResponse);
    }
    private function verifyWroteZipAndSignatureFilesToTargetDir(\TestState $state): void {
        $this->assertEquals(200, $state->spyingResponse->getActualStatusCode());
        $matches = null;
        preg_match("/^Ok, created release to `(.+)`, and signature to `(.+)`$/",
                    $state->spyingResponse->getActualBody(),
                    $matches);
        $this->assertCount(3, $matches, "Should return output file paths");
        $this->assertFileExists($matches[1]);
        $this->assertFileExists($matches[2]);
        $this->actuallyWrittenZipFilePath = $matches[1];
        $this->actuallyWrittenSignatureFilePath = $matches[2];
    }
    private function verifyIncludedBackendFilesToZip(\TestState $state): void {
        $pkg = $this->openAndGetActualWrittenZip();
        // Not vendor files
        $expectedFiles1 = require dirname(__DIR__) . "/assets/cms-backend-dir-files.php";
        $stripDirNs = Updater::makeRelatifier(Pkg::FILE_NS_BACKEND);
        foreach ($expectedFiles1 as $nsdRelFilePath) {
            $relFilePath = $stripDirNs($nsdRelFilePath);
            $this->assertStringEqualsFile(SIVUJETTI_BACKEND_PATH . $relFilePath,
                                          $pkg->read($nsdRelFilePath));
        }
        // Vendor files
        $expectedFiles2 = require dirname(__DIR__) . "/assets/cms-backend-vendor-dir-files.php";
        foreach ($expectedFiles2 as $nsdRelFilePath) {
            $relFilePath = $stripDirNs($nsdRelFilePath);
            $this->assertEquals(self::FILES_GENERATED_BY_COMPOSER[$relFilePath],
                                $pkg->read($nsdRelFilePath));
        }
        // file list
        $actualFilesList = Updater::readSneakyJsonData(Pkg::LOCAL_NAME_BACKEND_FILES_LIST, $pkg);
        $this->assertEquals(array_merge($expectedFiles1, $expectedFiles2), $actualFilesList);
    }
    private function verifyIncludedPublicFilesToZip(\TestState $state): void {
        $pkg = $this->openAndGetActualWrittenZip();
        $base = SIVUJETTI_PUBLIC_PATH;
        // $indexPath/public/sivujetti/assets/*.*
        $expectedAssetFiles = require dirname(__DIR__) . "/assets/cms-index-asset-dir-files.php";
        $stripDirNs = Updater::makeRelatifier(Pkg::FILE_NS_INDEX);
        foreach ($expectedAssetFiles as $nsdRelFilePath) {
            $this->assertStringEqualsFile("{$base}{$stripDirNs($nsdRelFilePath)}",
                                          $pkg->read($nsdRelFilePath));
        }
        // $indexPath/public/sivujetti/vendor/*.*
        $expectedVendorFiles = require dirname(__DIR__) . "/assets/cms-index-vendor-dir-files.php";
        foreach ($expectedVendorFiles as $nsdRelFilePath) {
            $this->assertStringEqualsFile("{$base}{$stripDirNs($nsdRelFilePath)}",
                                          $pkg->read($nsdRelFilePath));
        }
        // $indexPath/public/sivujetti/*.css
        $expectedCssFiles = require dirname(__DIR__) . "/assets/cms-index-sivujetti-dir-css-files.php";
        foreach ($expectedCssFiles as $nsdRelFilePath) {
            $this->assertStringEqualsFile("{$base}{$stripDirNs($nsdRelFilePath)}",
                                          $pkg->read($nsdRelFilePath));
        }
        // $indexPath/public/sivujetti/*.js
        $expectedJsFiles = require dirname(__DIR__) . "/assets/cms-index-sivujetti-dir-js-files.php";
        $stripDirNs2 = Updater::makeRelatifier(Pkg::FILE_NS_INDEX . "public/sivujetti/");
        foreach ($expectedJsFiles as $nsdRelFilePath) {
            $relFilePath = $stripDirNs2($nsdRelFilePath);
            $this->assertEquals(self::FILES_GENERATED_BY_JS_BUNDLER[$relFilePath],
                                $pkg->read($nsdRelFilePath));
        }
        // $indexPath/*.*
        $expectedRootFiles = require dirname(__DIR__) . "/assets/cms-index-dir-files.php";
        foreach ($expectedRootFiles as $nsdRelFilePath) {
            $this->assertStringEqualsFile("{$base}{$stripDirNs($nsdRelFilePath)}",
                                          $pkg->read($nsdRelFilePath));
        }
        // file list
        $actualFilesList = Updater::readSneakyJsonData(Pkg::LOCAL_NAME_INDEX_FILES_LIST, $pkg);
        $this->assertEquals(array_merge(
            $expectedAssetFiles,
            $expectedVendorFiles,
            $expectedCssFiles,
            $expectedRootFiles,
            $expectedJsFiles
        ), $actualFilesList);
    }
    private function openAndGetActualWrittenZip(): ZipPackageStream {
        $pkg = new ZipPackageStream(new FileSystem);
        $pkg->open($this->actuallyWrittenZipFilePath);
        return $pkg;
    }
}
