<?php declare(strict_types=1);

namespace Sivujetti\Tests\Upload;

use Sivujetti\Tests\Utils\{DbDataHelper, HttpApiTestTrait};
use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\App;
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
     * @param \TestState $state
     */
    protected function makeTestSivujettiApp(\TestState $state): void {
        $state->app = $this->makeApp(
            fn() => App::create(self::setGetConfig()),
            function ($di) use ($state) {
                $di->define(Uploader::class, [
                    ":moveUploadedFileFn" => $this->createMockMoveUploadedFileFn($state),
                ]);
            }
        );
    }
    private function createMockMoveUploadedFileFn(\TestState $state): \Closure {
        $state->actuallyMovedFileTo = null;
        return function ($_tmpFilePath, $targetFilePath) use ($state) {
            $state->actuallyMovedFileTo = $targetFilePath;
            return true;
        };
    }
}
