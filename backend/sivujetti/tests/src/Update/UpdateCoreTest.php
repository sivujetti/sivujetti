<?php declare(strict_types=1);

namespace Sivujetti\Tests\Update;

use Pike\Injector;
use Sivujetti\{App, FileSystem};
use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\Cli\Bundler;
use Sivujetti\Tests\Utils\{HttpApiTestTrait, TestEnvBootstrapper};
use Sivujetti\Update\{PackageStreamInterface, Updater, ZipPackageStream};

final class UpdateCoreTest extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    private const CMS_CLONE_BACKEND_PATH = SIVUJETTI_INDEX_PATH . "cms-clone-tmp/backend";
    private const CMS_CLONE_INDEX_PATH = SIVUJETTI_INDEX_PATH . "cms-clone-tmp";
    private const TEST_PATCH_CLS_FILE_PATH = SIVUJETTI_BACKEND_PATH . "sivujetti/src/Update/Patch/TestPatchTask.php";
    private const TEST_PATCH_MAP_FILE_PATH = SIVUJETTI_BACKEND_PATH . "test-patch.json";
    private FileSystem $fs;
    protected function setUp(): void {
        parent::setUp();
        $this->fs = new FileSystem;
        $this->fs->mkDir(self::CMS_CLONE_BACKEND_PATH);
    }
    protected function tearDown(): void {
        parent::tearDown();
        $this->fs->deleteFilesRecursive(self::CMS_CLONE_INDEX_PATH,
                                        SIVUJETTI_INDEX_PATH);
        if ($this->fs->isFile(self::TEST_PATCH_CLS_FILE_PATH))
            $this->fs->unlink(self::TEST_PATCH_CLS_FILE_PATH);
        if ($this->fs->isFile(self::TEST_PATCH_MAP_FILE_PATH))
            $this->fs->unlink(self::TEST_PATCH_MAP_FILE_PATH);
    }
    public static function getDbConfig(): array {
        return require TEST_CONFIG_FILE_PATH;
    }
    /**
     * @group intensives
     */
    public function testUpdateCoreUpdatesCms(): void {
        $state = $this->setupTest();
        $this->writeTestUpdateZip($state);
        $this->makeUpdateTestApp($state);
        $this->sendUpdateCoreRequest($state);
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
        $this->verifyOverwroteBackendSourceFiles($state);
        $this->verifyOverwrotePublicSourceFiles($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->inputData = (object) ["toVersion" => '99' . App::VERSION];
        $state->app = null;
        $state->spyingResponse = null;
        return $state;
    }
    private function writeTestUpdateZip(\TestState $state): void {
        $outFilePath = self::CMS_CLONE_BACKEND_PATH . "/sivujetti-{$state->inputData->toVersion}.zip";
        $fs = new FileSystem;
        $pkg = new ZipPackageStream($fs);
        (new Bundler($fs, printFn: function () { }))->makeRelease($pkg, $outFilePath, true);
    }
    private function makeUpdateTestApp(\TestState $state): void {
        $this->makeTestSivujettiApp($state, function (TestEnvBootstrapper $bootModule) {
            $bootModule->useMockAlterer(function (Injector $di) {
                $di->define(Updater::class, [
                    ':targetBackendDirPath' => self::CMS_CLONE_BACKEND_PATH . "/",
                    ':targetIndexDirPath' => self::CMS_CLONE_INDEX_PATH . "/",
                ]);
            });
        });
    }
    private function sendUpdateCoreRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/updates/core", "PUT", $state->inputData));
    }
    private function verifyOverwroteBackendSourceFiles(\TestState $state): void {
        $this->verifyOverwroteTheseFiles("backend-files", $state);
    }
    private function verifyOverwrotePublicSourceFiles(\TestState $state): void {
        $this->verifyOverwroteTheseFiles("index-files", $state);
    }
    private function verifyOverwroteTheseFiles(string $which, \TestState $state): void {
        [$actualFileListFileName, $pathPrefix, $localDir] = $which === "backend-files"
            ? [PackageStreamInterface::LOCAL_NAME_BACKEND_FILES_LIST,
               PackageStreamInterface::FILE_NS_BACKEND,
               self::CMS_CLONE_BACKEND_PATH . "/"]
            : [PackageStreamInterface::LOCAL_NAME_INDEX_FILES_LIST,
               PackageStreamInterface::FILE_NS_INDEX,
               self::CMS_CLONE_INDEX_PATH . "/"];
        //
        $pkg = new ZipPackageStream(new FileSystem);
        $testUpdateZipPath = self::CMS_CLONE_BACKEND_PATH . "/sivujetti-{$state->inputData->toVersion}.zip";
        $pkg->open($testUpdateZipPath);
        //
        $paths = Updater::readSneakyJsonData($actualFileListFileName, $pkg);
        $stripNs = Updater::makeRelatifier($pathPrefix);
        foreach ($paths as $nsdRelFilePath) {
            $this->assertStringEqualsFile("{$localDir}{$stripNs($nsdRelFilePath)}",
                                          $pkg->read($nsdRelFilePath),
                                          "Should overwrite local file with update package zip's file");
        }
    }


    /////////////////////////////////////////////////////////////////////////////


    public function tesUpdateCoreRunsPatchFiles(): void {
        $state = $this->setupRunPatchClassesTest();
        $this->writeTestPatchZip($state);
        $this->makeUpdateTestApp($state);
        $this->sendUpdateCoreRequest($state);
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
        $this->verifyWrotePatchFiles($state);
        $this->verifyExecutedPatchFiles($state);
    }
    private function setupRunPatchClassesTest(): \TestState {
        $state = new \TestState;
        $state->inputData = (object) ["toVersion" => "99.99.99-test"];
        $state->app = null;
        $state->spyingResponse = null;
        return $state;
    }
    private function writeTestPatchZip(\TestState $state): void {
        $outFilePath = self::CMS_CLONE_BACKEND_PATH . "/sivujetti-{$state->inputData->toVersion}.zip";
        $fs = new FileSystem;
        $pkg = new ZipPackageStream($fs);
        $testPatchClsPath = SIVUJETTI_BACKEND_PATH . "sivujetti/tests/assets/TestPatchTask.php.tmpl";
        $this->fs->copy($testPatchClsPath, self::TEST_PATCH_CLS_FILE_PATH);
        $nsdFilePath = str_replace(SIVUJETTI_BACKEND_PATH, "\$backend/", self::TEST_PATCH_CLS_FILE_PATH);
        $this->fs->write(self::TEST_PATCH_MAP_FILE_PATH, json_encode([
            "backendFiles" => [$nsdFilePath],
            "indexFiles" => []
        ]));
        $patchMapFileName = substr(self::TEST_PATCH_MAP_FILE_PATH, strrpos(self::TEST_PATCH_MAP_FILE_PATH, "/") + 1);
        (new Bundler($fs, printFn: function () { }))->makePatch($pkg, $outFilePath, $patchMapFileName);
    }
    private function verifyWrotePatchFiles(\TestState $state): void {
        $this->assertStringEqualsFile(self::TEST_PATCH_CLS_FILE_PATH,
            $this->fs->read(SIVUJETTI_BACKEND_PATH . "sivujetti/tests/assets/TestPatchTask.php.tmpl"),
            "Should overwrite local file with update package zip's file");
    }
    private function verifyExecutedPatchFiles(\TestState $state): void {
        $testMutation = self::$db->fetchOne("SELECT `data` FROM \${p}storedObjects WHERE objectName = ?", ["Sivujetti:test"]);
        $this->assertNotNull($testMutation);
        $this->assertEquals(json_encode(["foo" => "bar"]), $testMutation["data"]);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdateCoreRejectsRequestIfToVersionIsNotValidSemVerVersion(): void {
        $state = $this->setupTest();
        $state->inputData->toVersion = "not-valid-version";
        $this->makeUpdateTestApp($state);
        $this->sendUpdateCoreRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals(["toVersion is not valid"],
                                        $state->spyingResponse);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdateCoreRejectsRequestIfToVersionIsOlderOrEqualThanCurrentVersion(): void {
        $state = $this->setupTest();
        $this->makeUpdateTestApp($state);
        $sendRequestAndVerify = function (string $input) use ($state) {
            $state->spyingResponse = null;
            $state->inputData->toVersion = $input;
            $this->sendUpdateCoreRequest($state);
            $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
            $this->verifyResponseBodyEquals(["toVersion must be > than currentVersion"],
                                            $state->spyingResponse);
        };
        //
        $sendRequestAndVerify("0.0.0");
        $sendRequestAndVerify(App::VERSION);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdateCoreReturnsIfUpdateWasAlreadyInProgress(): void {
        $state = $this->setupTest();
        $this->makeUpdateTestApp($state);
        $this->simulateUpdateIsAlreadyStartedByAnotherRequest($state);
        $this->sendUpdateCoreRequest($state);
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals((object) ["ok" => "ok", "detailsCode" => Updater::RESULT_ALREADY_IN_PROGRESS],
                                        $state->spyingResponse);
    }
    private function simulateUpdateIsAlreadyStartedByAnotherRequest(\TestState $state): void {
        self::$db->exec("UPDATE `\${p}jobs` SET `startedAt` = ? WHERE `jobName` = ?",
                        [time(), "update-core"]);
    }
}
