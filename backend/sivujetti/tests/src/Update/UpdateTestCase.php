<?php declare(strict_types=1);

namespace Sivujetti\Tests\Update;

use Pike\Injector;
use Sivujetti\{FileSystem};
use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\Tests\Utils\{HttpApiTestTrait, TestEnvBootstrapper};
use Sivujetti\Update\{HttpClientInterface, HttpClientResp, Signer, Updater, ZipPackageStream};

abstract class UpdateTestCase extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    protected const CMS_CLONE_BACKEND_PATH = SIVUJETTI_INDEX_PATH . "cms-clone-tmp/backend";
    protected const CMS_CLONE_INDEX_PATH = SIVUJETTI_INDEX_PATH . "cms-clone-tmp";
    protected FileSystem $fs;
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
    public static function getDbConfig(): array {
        return (require TEST_CONFIG_FILE_PATH)["app"];
    }
    protected function setupTest(): \TestState {
        $state = new \TestState;
        $state->app = null;
        $state->spyingResponse = null;
        $state->di = null;
        return $state;
    }
    protected function makeUpdateTestApp(\TestState $state, ?\Closure $getAdditionalUpdaterMockArgs = null): void {
        $updaterMockArgs = [
            ...($getAdditionalUpdaterMockArgs ? $getAdditionalUpdaterMockArgs() : []),
            ":targetBackendDirPath" => self::CMS_CLONE_BACKEND_PATH . "/",
            ":targetIndexDirPath" => self::CMS_CLONE_INDEX_PATH . "/",
        ];
        $this->makeTestSivujettiApp($state, function (TestEnvBootstrapper $bootModule) use ($state, $updaterMockArgs) {
            $bootModule->useMockAlterer(function (Injector $di) use ($state, $updaterMockArgs) {
                $di->define(Updater::class, $updaterMockArgs);
                $state->di = $di;
            });
        });
    }
}
