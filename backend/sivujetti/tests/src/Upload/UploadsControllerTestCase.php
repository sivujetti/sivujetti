<?php declare(strict_types=1);

namespace Sivujetti\Tests\Upload;

use PHPUnit\Framework\MockObject\MockObject;
use Pike\{FileSystem, Injector};
use Pike\Interfaces\SessionInterface;
use Sivujetti\Tests\Utils\{DbDataHelper, HttpApiTestTrait, TestEnvBootstrapper};
use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\Upload\Uploader;

/**
 * @phpstan-import-type UploadsEntryShape from \Sivujetti\Upload\Entities\UploadsEntry
 */
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
                $di->delegate(FileSystem::class, fn() =>
                    $this->makeFsThatDeletesFileSuccesfully($state)
                );
            });
        });
    }
    /**
     * @return list<UploadsEntryShape>
     */
    protected function createSampleFiles(): array {
        return [
            (object) ["id" => "1",
                      "fileName" => "a-cat.png",
                      "baseDir" => "sub-dir/",
                      "mime" => "image/png",
                      "friendlyName" => "",
                      "createdAt" => 1320969601,
                      "updatedAt" => 0],
            (object) ["id" => "2",
                      "fileName" => "niss.jpg",
                      "baseDir" => "sub-dir/",
                      "mime" => "image/jpeg",
                      "friendlyName" => "Everdeen",
                      "createdAt" => 1320969601,
                      "updatedAt" => 0],
            (object) ["id" => "3",
                      "fileName" => "readme.txt",
                      "baseDir" => "",
                      "mime" => "text/plain",
                      "friendlyName" => "",
                      "createdAt" => 1320969601,
                      "updatedAt" => 0]
        ];
    }
    private function createMockMoveUploadedFileFn(\TestState $state): \Closure {
        $state->actuallyMovedFileTo = null;
        return function ($_tmpFilePath, $targetFilePath) use ($state) {
            $state->actuallyMovedFileTo = $targetFilePath;
            return true;
        };
    }
    private function makeFsThatDeletesFileSuccesfully(\TestState $state): MockObject {
        $out = $this->createMock(FileSystem::class);
        $out->method("isFile")->willReturn(true);
        $out->method("unlink")->with($this->callback(function ($filePath) use ($state) {
            $state->actuallyDeletedFilePath = $filePath;
            return true;
        }))->willReturn(true);
        return $out;
    }
}
