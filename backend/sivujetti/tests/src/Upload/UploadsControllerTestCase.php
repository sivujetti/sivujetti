<?php declare(strict_types=1);

namespace Sivujetti\Tests\Upload;

use Pike\Injector;
use Sivujetti\Tests\Utils\{DbDataHelper, HttpApiTestTrait, TestEnvBootstrapper};
use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\Upload\Uploader;

abstract class UploadsControllerTestCase extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    /** @var Sivujetti\Tests\Utils\DbDataHelper */
    protected DbDataHelper $dbDataHelper;
    /**
     */
    protected function setUp(): void {
        parent::setUp();
        $this->dbDataHelper = new DbDataHelper(self::$db);
    }
    /**
     * @inheritdoc
     */
    public static function getDbConfig(): array {
        return require TEST_CONFIG_FILE_PATH;
    }
    /**
     * @param \TestState $state
     */
    protected function makeSivujettiAppForUploadsTest(\TestState $state): void {
        $this->makeTestSivujettiApp($state, function (TestEnvBootstrapper $bootModule) use($state) {
            $bootModule->useMockAlterer(function (Injector $di) use($state) {
                $di->define(Uploader::class, [
                    ":moveUploadedFileFn" => $this->createMockMoveUploadedFileFn($state),
                ]);
            });
        });
    }
    private function createMockMoveUploadedFileFn(\TestState $state): \Closure {
        $state->actuallyMovedFileTo = null;
        return function ($_tmpFilePath, $targetFilePath) use ($state) {
            $state->actuallyMovedFileTo = $targetFilePath;
            return true;
        };
    }
}
