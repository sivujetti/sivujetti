<?php declare(strict_types=1);

namespace Sivujetti\Cli\Tests;

use Sivujetti\Cli\App;
use Pike\{FileSystem, Request};
use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\Cli\Bundler;
use Sivujetti\Update\{PackageStreamInterface, Updater, ZipPackageStream};

final class BundleCmsToZipTest extends DbTestCase {
    use HttpTestUtils;
    private string $actuallyWrittenZipFilePath;
    private string $actuallyWrittenSignatureFilePath;
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
        $this->makeCliTestApp($state);
        $this->invokeCreateZipReleaseFeature($state);
        $this->verifyReturnedSuccesfully($state);
        $this->verifyWroteZipAndSignatureFilesToTargetDir($state);
        $this->verifyIncludedBackendFilesToZip($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->testInput = (object) [
            // $signer->hex2bin($signer->generateSigningKeyPair()->secretKey)
            "secretKey" => "17c31ad9c358901e0c3364025ddae226dbd95fd130bf85eac802a29e9d363bdef636a6df9e68639e6594a1f3a412fb3479b1cebb62460d96464e5cbcc66d38d6"
        ];
        $state->cliApp = null;
        $state->actuallyWrittenZipFilePath = null;
        $state->actuallyWrittenSignatureFilePath = null;
        $state->spyingResponse = null;
        return $state;
    }
    private function makeCliTestApp(\TestState $state): void {
        $state->cliApp = $this->makeApp(fn() => App::create(self::setGetConfig()), function ($di) {
            $di->define(Bundler::class, [
                ':printFn' => function() { echo 'foo'; }
            ]);
        });
    }
    private function invokeCreateZipReleaseFeature(\TestState $state): void {
        $state->spyingResponse = $state->cliApp->sendRequest(
            new Request("/create-release/to-zip/{$state->testInput->secretKey}", "PSEUDO:CLI"));
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
        $pkg = new ZipPackageStream(new FileSystem);
        $pkg->open($this->actuallyWrittenZipFilePath);
        $expectedFiles = require dirname(__DIR__) . "/assets/cms-backend-files.php";
        $stripDirNs = Bundler::makeRelatifier(PackageStreamInterface::FILE_NS_BACKEND);
        foreach ($expectedFiles as $nsdRelFilePath) {
            $relFilePath = $stripDirNs($nsdRelFilePath);
            $this->assertStringEqualsFile(SIVUJETTI_BACKEND_PATH . $relFilePath,
                                          $pkg->read($nsdRelFilePath));
        }
        $actualFilesList = Updater::readSneakyJsonData("backend-files-list.php", $pkg);
        $this->assertEquals($expectedFiles, $actualFilesList);
    }
}
