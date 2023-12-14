<?php declare(strict_types=1);

namespace Sivujetti\Tests\Update;

use Pike\Injector;
use Sivujetti\{FileSystem};
use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\Tests\Utils\{HttpApiTestTrait, TestEnvBootstrapper};
use Sivujetti\Update\{Updater};

final class BeginUpdateTest extends DbTestCase {
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
        return (require TEST_CONFIG_FILE_PATH)["app"];
    }
    public function testBeginUpdatesStartTheUpdateProcess(): void {
        $state = $this->setupTest();
        $this->makeUpdateTestApp($state);
        $this->sendBeginUpdateRequest($state);
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
        $this->verifyMarkedUpdatesAsStarted($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->app = null;
        $state->spyingResponse = null;
        return $state;
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
    private function sendBeginUpdateRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/updates/begin", "PUT"));
    }
    private function verifyMarkedUpdatesAsStarted(\TestState $state): void {
        $job = self::$db->fetchOne("SELECT * FROM `\${p}jobs` WHERE `jobName` = ?", ["updates:all"]);
        $this->assertGreaterThanOrEqual(time() - 10, $job["startedAt"]);
    }


    /////////////////////////////////////////////////////////////////////////////


    public function testBeginUpdatesRejectsRequestIfUpdateWasAlreadyInProgress(): void {
        $state = $this->setupTest();
        $this->makeUpdateTestApp($state);
        $this->simulateUpdateIsAlreadyStartedByAnotherRequest($state);
        $this->sendBeginUpdateRequest($state);
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals((object) ["ok" => "ok", "detailsCode" => Updater::RESULT_ALREADY_IN_PROGRESS],
                                        $state->spyingResponse);
    }
    private function simulateUpdateIsAlreadyStartedByAnotherRequest(\TestState $state): void {
        self::$db->exec("UPDATE `\${p}jobs` SET `startedAt` = ? WHERE `jobName` = ?",
                        [time(), "updates:all"]);
    }
}
