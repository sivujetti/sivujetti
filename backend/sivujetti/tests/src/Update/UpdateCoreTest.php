<?php declare(strict_types=1);

namespace Sivujetti\Tests\Update;

use Sivujetti\{App, FileSystem};
use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\Cli\Bundler;
use Sivujetti\Tests\Utils\HttpApiTestTrait;
use Sivujetti\Update\{PackageStreamInterface, Updater, ZipPackageStream};

final class UpdateCoreTest extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    private const CMS_CLONE_BACKEND_PATH = SIVUJETTI_INDEX_PATH . "cms-clone-tmp/backend";
    private const CMS_CLONE_INDEX_PATH = SIVUJETTI_INDEX_PATH . "cms-clone-tmp";
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
    }
    /**
     * @group intensives
     */
    public function testUpdateCoreUpdatesCms(): void {
        $state = $this->setupTest();
        $this->writeTestUpdateZip($state);
        $this->makeTestSivujettiApp($state);
        $this->sendUpdateCoreRequest($state);
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
        $this->verifyOverwroteBackendSourceFiles($state);
        $this->verifyOverwrotePublicSourceFiles($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->inputData = (object) ["toVersion" => '99' . App::VERSION];
        $state->sivujettiApp = null;
        $state->spyingResponse = null;
        return $state;
    }
    private function writeTestUpdateZip(\TestState $state): void {
        $outFilePath = self::CMS_CLONE_BACKEND_PATH . "/sivujetti-{$state->inputData->toVersion}.zip";
        $fs = new FileSystem;
        $pkg = new ZipPackageStream($fs);
        (new Bundler($fs, function () { }))->makeRelease($pkg, $outFilePath, true);
    }
    private function makeTestSivujettiApp(\TestState $state): void {
        $state->sivujettiApp = $this->makeApp(fn() => App::create(self::setGetConfig()), function ($di) {
            $di->define(Updater::class, [
                ':targetBackendDirPath' => self::CMS_CLONE_BACKEND_PATH . "/",
                ':targetIndexDirPath' => self::CMS_CLONE_INDEX_PATH . "/",
            ]);
        });
    }
    private function sendUpdateCoreRequest(\TestState $state): void {
        $state->spyingResponse = $state->sivujettiApp->sendRequest(
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


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdateCoreRejectsRequestIfToVersionIsNotValidSemVerVersion(): void {
        $state = $this->setupTest();
        $state->inputData->toVersion = "not-valid-version";
        $this->makeTestSivujettiApp($state);
        $this->sendUpdateCoreRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals(["toVersion is not valid"],
                                        $state->spyingResponse);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdateCoreRejectsRequestIfToVersionIsOlderOrEqualThanCurrentVersion(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
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
        $this->makeTestSivujettiApp($state);
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
