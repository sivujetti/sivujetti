<?php declare(strict_types=1);

namespace Sivujetti\Tests\Upload;

use Pike\Injector;
use Pike\Interfaces\SessionInterface;
use Sivujetti\Tests\Utils\{DbDataHelper, HttpApiTestTrait, TestEnvBootstrapper};
use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\Upload\Uploader;

abstract class UploadsControllerTestCase extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    /** @var Sivujetti\Tests\Utils\DbDataHelper */
    protected DbDataHelper $dbDataHelper;
    /**
     * @inheritdoc
     */
    protected function setUp(): void {
        parent::setUp();
        $this->dbDataHelper = new DbDataHelper(self::$db);
    }
    /**
     * @inheritdoc
     */
    public static function getDbConfig(): array {
        return (require TEST_CONFIG_FILE_PATH)["app"];
    }
    /**
     * @param \TestState $state
     * @param ?int $userRole = null
     * @param ?array $addTheseToPreviouslyUploadedFiles = []
     */
    protected function makeSivujettiAppForUploadsTest(\TestState $state,
                                                        ?int $userRole = null,
                                                        ?array $addTheseToPreviouslyUploadedFiles = []): void {
        if ($addTheseToPreviouslyUploadedFiles) {
            [$qGroups, $vals, $cols] = self::$db->makeBatchInsertQParts(array_map(fn(string $fileName) => (object) [
                "fileName" => $fileName, "baseDir" => "", "mime" => "image/jpeg", "friendlyName" => "-",
            ], $addTheseToPreviouslyUploadedFiles));
            self::$db->exec("INSERT INTO `\${p}files` ({$cols}) VALUES {$qGroups}", $vals);
        }
        $this->makeTestSivujettiApp($state, function (TestEnvBootstrapper $bootModule) use ($state, $userRole) {
            if ($userRole !== null) {
                $bootModule->useMock("auth", [":session" => $this->createMock(SessionInterface::class),
                                              ":userRole" => $userRole]);
            }
            $bootModule->useMockAlterer(function (Injector $di) use ($state) {
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
