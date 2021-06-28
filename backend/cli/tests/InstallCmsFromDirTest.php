<?php declare(strict_types=1);

namespace KuuraCms\Cli\Tests;

use Auryn\Injector;
use KuuraCms\Cli\App;
use KuuraCms\Installer\Commons;
use Pike\{Db, FileSystem, Request, TestUtils\DbTestCase, TestUtils\HttpTestUtils};

final class InstallCmsFromDirTest extends DbTestCase {
    use HttpTestUtils;
    protected FileSystem $fs;
    protected function setUp(): void {
        parent::setUp();
        $this->fs = new FileSystem;
    }
    public function testInstallFromDirInstallsSiteFromLocalDirectory(): void {
        $state = $this->setupTest();
        $this->makeInstallerTestApp($state);
        $this->invokeInstallFromDirFeature($state);
        $this->verifyFeatureFinishedSuccesfully($state);
        $this->verifyCreatedDbAndSchema($state->getInstallerDb->__invoke());
        $this->cleanUp($state);
    }
    private function makeInstallerTestApp(\TestState $state): void {
        $state->installerApp = $this->makeApp(fn() => App::create(self::setGetConfig()), function (Injector $di) use ($state) {
            $di->prepare(Commons::class, function (Commons $instance) use ($state) {
                $instance->setTargetSitePath('install-from-dir-site/');
                $state->getTargetSitePath = fn() => $instance->getTargetSitePath();
                $state->getInstallerDb = fn() => $instance->getDb();
            });
        });
    }
    private function invokeInstallFromDirFeature(\TestState $state): void {
        $state->spyingResponse = $state->installerApp->sendRequest(
            new Request("/install-from-dir/basic-site", "PSEUDO:CLI"));
    }
    private function verifyFeatureFinishedSuccesfully(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals(["ok" => "ok"], $state->spyingResponse);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->installerApp = null;
        $state->getInstallerDb = null;
        $state->getTargetSitePath = null;
        $state->spyingResponse = null;
        return $state;
    }
    private function verifyCreatedDbAndSchema(Db $installerDb): void {
        $numAffected = $installerDb->exec("INSERT INTO `plugins` (`name`) VALUES (?)", ["test"]);
        $this->assertEquals(1, $numAffected, "Should succeed");
        $installerDb->exec("DELETE FROM `plugins` WHERE `id` = ?", [$installerDb->lastInsertId()]);
    }
    private function cleanUp(\TestState $state): void {
        $c = $this->fs->read(KUURA_BACKEND_PATH . "installer/sample-content/basic-site/config.php");
        $actualConfig = json_decode(substr($c, strlen("<?php // ")), associative: true);
        foreach ($actualConfig as $key => $_)
            $actualConfig[$key] = str_replace('${targetSitePath}', $state->getTargetSitePath->__invoke(), $actualConfig[$key]);
        $installerDb = $state->getInstallerDb->__invoke();
        if ($installerDb->attr(\PDO::ATTR_DRIVER_NAME) === "sqlite") {
            $this->fs->unlink(substr($actualConfig["db.connPath"], strlen("sqlite:")));
        } else {
            $installerDb->exec("DROP DATABASE `{$actualConfig["db.database"]}`");
        }
    }
}
