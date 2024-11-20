<?php declare(strict_types=1);

namespace Sivujetti\Tests\Update;

use Pike\Db\FluentDb2;
use Pike\TestUtils\MutedSpyingResponse;
use Sivujetti\{AppEnv, FileSystem, JsonUtils};
use Sivujetti\Cli\Bundler;
use Sivujetti\Update\{HttpClientInterface, HttpClientResp, Signer, Updater, ZipPackageStream};

final class RunUpdatesTest extends UpdateTestCase {
    private const TEST_PKG_PATH = __DIR__ . "/test-update.zip";
    private const TEST_PKG_SECRET_KEY = "df85e55eaa2680f9722abe09d5ad1a4a5fa3694653a44e7eea60c1dfbb0409dcc2ae2297e7591045df33cc48a86b1755d9e51b5e24737dd190fad4dfef1d2769";
    private const TEST_PKG_PUBLIC_KEY = "c2ae2297e7591045df33cc48a86b1755d9e51b5e24737dd190fad4dfef1d2769";
    protected function tearDown(): void {
        parent::tearDown();
        if ($this->fs->isFile(self::TEST_PKG_PATH))
            $this->fs->unlink(self::TEST_PKG_PATH);
        $this->simulatePendinUpdatesDiscovered(null);
        (new FluentDb2(self::$db))->update("\${p}jobs")
            ->values((object) ["startedAt" => 0])
            ->where("`jobName` = ?", ["updates:all"])
            ->execute();
    }
    public function testInstallUpdateInstallsUpdate(): void {
        $state = $this->setupDoTheUpdateTest();
        $this->createRunUpdatesTestApp($state);
        $this->writeTestUdpatePackageAndGenSig($state);
        $this->simulatePendinUpdatesDiscovered($state);
        $this->simulateBeginUpdateFeature($state);
        $this->simulateDownloadUpdateFeature($state);
        $this->sendInstallUpdateRequest($state);
        $this->verifyRequestReturnedWithOk($state->spyingResponse);
        $this->verifyWroteFilesFromThePackage($state);
        $this->simulateFinishUpdateFeature($state);
    }
    private function setupDoTheUpdateTest(): \TestState {
        $state = parent::setupTest();
        $state->testPackages = [(object) [
            "name" => "sivujetti-9999.0.0",
            "sig" => null,
        ]];
        $state->testUpdateFiles = [
            [SIVUJETTI_BACKEND_PATH . "testfile.php",                "<" . "?php echo 'foo';"],
            [SIVUJETTI_INDEX_PATH   . "public/testfile.js",          "console.log('foo');"],
            [SIVUJETTI_BACKEND_PATH . "sivujetti_test-patch-0.json", JsonUtils::stringify([
                                                                        "backendFiles" => ["\$backend/testfile.php"],
                                                                        "indexFiles" => ["\$index/public/testfile.js"],
                                                                    ])],
        ];
        return $state;
    }
    private function createRunUpdatesTestApp(\TestState $state): void {
        $this->makeUpdateTestApp($state, fn() => [
            ":http" => new class(self::TEST_PKG_PATH) implements HttpClientInterface {
                public function __construct(private string $testTmpPkgPath) { }
                public function get(string $url, ?array $headers = null): HttpClientResp {
                    return new HttpClientResp;
                }
                public function downloadFileToDisk(string $url, string &$targetLocalFilePath, ?array $headers = null): HttpClientResp {
                    (new FileSystem)->copy($this->testTmpPkgPath, $targetLocalFilePath);
                    $respOut = new HttpClientResp;
                    $respOut->status = 200;
                    $respOut->data = "";
                    $respOut->headers = [];
                    return $respOut;
                }
            },
            "+appEnv" => function ($_, $di) {
                $appEnv = $di->make(AppEnv::class);
                $appEnv->constants["UPDATE_KEY"] = self::TEST_PKG_PUBLIC_KEY;
                return $appEnv;
            },
        ]);
    }
    private function writeTestUdpatePackageAndGenSig(\TestState $state, ?string $testPackageSecretKey = null): void {
        $fs = new FileSystem;
        try {
            foreach ($state->testUpdateFiles as [$filePath, $contents])
                $fs->write($filePath, $contents);
            $zip = new ZipPackageStream($fs);
            $relMapFilePath = Updater::makeRelatifier(SIVUJETTI_BACKEND_PATH)($state->testUpdateFiles[2][0]);
            $zipContents = (new Bundler($fs, printFn: function ($_) {}))->makePatch($zip, self::TEST_PKG_PATH, $relMapFilePath, true);
            // __DIR__ . "/test-update.zip" (self::TEST_PKG_PATH) now exist
            $signatureAsHex = (new Signer)->sign($zipContents, $testPackageSecretKey ?? self::TEST_PKG_SECRET_KEY);
            $state->testPackages[0]->sig = $signatureAsHex;
        } catch (\Exception $e) {
            echo "Failed to create test update package: `{$e->getTraceAsString()}`";
        } finally {
            foreach ($state->testUpdateFiles as [$filePath, $_]) {
                if ($fs->isFile($filePath))
                    $fs->unlink($filePath);
            }
        }
    }
    private function simulatePendinUpdatesDiscovered(\TestState $state = null): void {
        (new FluentDb2(self::$db))
            ->update("\${p}theWebsite")
            ->values((object) ["pendingUpdates" => $state ? JsonUtils::stringify($state->testPackages) : null])
            ->where("1 = 1")
            ->execute();
    }
    private function simulateBeginUpdateFeature(\TestState $state): void {
        $resp = $state->app->sendRequest($this->createApiRequest("/api/updates/begin", "PUT"));
        $this->verifyRequestReturnedWithOk($resp);
    }
    private function simulateDownloadUpdateFeature(\TestState $state, $expectToSucceed = true): void {
        $resp = $state->app->sendRequest($this->createApiRequest("/api/updates/{$state->testPackages[0]->name}/download", "POST"));
        if ($expectToSucceed) {
            $this->verifyRequestReturnedWithOk($resp);
            $this->assertFileExists(self::CMS_CLONE_BACKEND_PATH . "/{$state->testPackages[0]->name}.zip");
            return;
        }
        $this->verifyResponseMetaEquals(400, "application/json", $resp);
        $this->assertEquals("Expected update to be started", JsonUtils::parse($resp->getActualBody())[0]);
    }
    private function sendInstallUpdateRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/updates/{$state->testPackages[0]->name}/install", "PUT"));
    }
    private function verifyRequestReturnedWithOk(MutedSpyingResponse $resp): void {
        $this->verifyResponseMetaEquals(200, "application/json", $resp);
        $this->assertEquals(Updater::RESULT_OK, JsonUtils::parse($resp->getActualBody())->detailsCode);
    }
    private function verifyWroteFilesFromThePackage(\TestState $state): void {
        [$testAbsBackedDirFilePath, $backedFileContent] = $state->testUpdateFiles[0];
        [$testAbsFrontendPublicDirFilePath, $frontendFileContent] = $state->testUpdateFiles[1];
        $testRelBackedDirFilePath = Updater::makeRelatifier(SIVUJETTI_BACKEND_PATH)($testAbsBackedDirFilePath);
        $testRelFrontendDirFilePath = Updater::makeRelatifier(SIVUJETTI_INDEX_PATH)($testAbsFrontendPublicDirFilePath);
        $this->assertEquals(file_get_contents(self::CMS_CLONE_BACKEND_PATH . "/{$testRelBackedDirFilePath}"), $backedFileContent);
        $this->assertEquals(file_get_contents(self::CMS_CLONE_INDEX_PATH . "/{$testRelFrontendDirFilePath}"), $frontendFileContent);
    }
    private function simulateFinishUpdateFeature(\TestState $state): void {
        $code = $state->di->make(Updater::class)->finishUpdates($state->testPackages);
        $this->assertEquals(Updater::RESULT_OK, $code);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testInstallUpdateRejectsRequestIfDownloadedSigDoesNotMatchTheConfigsUPDATE_KEY(): void {
        $state = $this->setupDoTheUpdateTest();
        $this->createRunUpdatesTestApp($state);
        $this->writeTestUdpatePackageAndGenSig($state, strrev(self::TEST_PKG_SECRET_KEY));
        $this->simulatePendinUpdatesDiscovered($state);
        $this->simulateBeginUpdateFeature($state);
        $this->simulateDownloadUpdateFeature($state);
        $this->sendInstallUpdateRequest($state);
        $this->verifyResponseMetaEquals(500, "application/json", $state->spyingResponse);
        $this->assertEquals(Updater::RESULT_VERIFICATION_FAILED, JsonUtils::parse($state->spyingResponse->getActualBody())->detailsCode);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testDownloadUpdateRejectsRequestIfUpdateHasNotStarted(): void {
        $state = $this->setupDoTheUpdateTest();
        $this->createRunUpdatesTestApp($state);
        $this->writeTestUdpatePackageAndGenSig($state);
        $this->simulatePendinUpdatesDiscovered($state);
        // Omit $this->simulateBeginUpdateFeature($state);
        $this->simulateDownloadUpdateFeature($state, false);
        $this->sendInstallUpdateRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->assertEquals("Update not started", JsonUtils::parse($state->spyingResponse->getActualBody())[0]);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testDownloadUpdateRejectsRequestIfDownloadFails(): void {
        $state = $this->setupDoTheUpdateTest();
        $this->createRunUpdatesTestApp($state);
        $this->writeTestUdpatePackageAndGenSig($state);
        $this->simulatePendinUpdatesDiscovered($state);
        $this->simulateBeginUpdateFeature($state);
        // Omit $this->simulateDownloadUpdateFeature($state);
        $this->sendInstallUpdateRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->assertEquals("Update not downloaded", JsonUtils::parse($state->spyingResponse->getActualBody())[0]);
    }
}
