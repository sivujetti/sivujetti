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
    private const BACKEND_DIR_CLONE_PATH = SIVUJETTI_BACKEND_PATH . "backend-clone-tmp";
    private FileSystem $fs;
    protected function setUp(): void {
        parent::setUp();
        $this->fs = new FileSystem;
        $this->fs->mkDir(self::BACKEND_DIR_CLONE_PATH);
    }
    protected function tearDown(): void {
        parent::tearDown();
        $this->fs->deleteFilesRecursive(self::BACKEND_DIR_CLONE_PATH,
                                        SIVUJETTI_BACKEND_PATH);
    }
    public function testUpdateCoreUpdatesCms(): void {
        $state = $this->setupTest();
        $this->writeTestUpdateZip($state);
        $this->makeTestSivujettiApp($state);
        $this->sendUpdateCoreRequest($state);
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
        $this->verifyOverwroteBackendSourceFiles($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->testInput = (object) ["toVersion" => "0.6.0"];
        $state->sivujettiApp = null;
        $state->spyingResponse = null;
        return $state;
    }
    private function writeTestUpdateZip(\TestState $state): void {
        $outFilePath = self::BACKEND_DIR_CLONE_PATH . "/sivujetti-{$state->testInput->toVersion}.zip";
        $fs = new FileSystem;
        $pkg = new ZipPackageStream($fs);
        (new Bundler($fs, function () { }))->makeRelease($pkg, $outFilePath, true);
    }
    private function makeTestSivujettiApp(\TestState $state): void {
        $state->sivujettiApp = $this->makeApp(fn() => App::create(self::setGetConfig()), function ($di) {
            $di->define(Updater::class, [
                ':targetBackendDirPath' => self::BACKEND_DIR_CLONE_PATH . "/"
            ]);
        });
    }
    private function sendUpdateCoreRequest(\TestState $state): void {
        $state->spyingResponse = $state->sivujettiApp->sendRequest(
            $this->createApiRequest("/api/updates/core", "PUT", $state->testInput));
    }
    private function verifyOverwroteBackendSourceFiles(\TestState $state): void {
        $pkg = new ZipPackageStream(new FileSystem);
        $targetBase = self::BACKEND_DIR_CLONE_PATH . "/";
        $testUpdateZipPath = "{$targetBase}sivujetti-{$state->testInput->toVersion}.zip";
        $pkg->open($testUpdateZipPath);
        $paths = Updater::readSneakyJsonData(PackageStreamInterface::LOCAL_NAME_BACKEND_FILES_LIST, $pkg);
        $stripNs = Bundler::makeRelatifier(PackageStreamInterface::FILE_NS_BACKEND);
        foreach ($paths as $nsdRelFilePath) {
            $this->assertStringEqualsFile("{$targetBase}{$stripNs($nsdRelFilePath)}",
                                          $pkg->read($nsdRelFilePath),
                                          "Should overwrite local file with update package zip's file");
        }
    }
}
