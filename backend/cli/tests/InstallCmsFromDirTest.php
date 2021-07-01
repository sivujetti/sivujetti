<?php declare(strict_types=1);

namespace KuuraCms\Cli\Tests;

use Auryn\Injector;
use KuuraCms\Cli\App;
use KuuraCms\Installer\{Commons, LocalDirPackage};
use KuuraCms\Tests\Utils\PageTestUtils;
use Pike\{Db, FileSystem, Request, TestUtils\DbTestCase, TestUtils\HttpTestUtils};

final class InstallCmsFromDirTest extends DbTestCase {
    use HttpTestUtils;
    private FileSystem $fs;
    private LocalDirPackage $sitePackage;
    private \TestState $state;
    protected function setUp(): void {
        parent::setUp();
        $this->fs = new FileSystem;
        $this->sitePackage = new LocalDirPackage($this->fs);
        $this->sitePackage->open('basic-site');
    }
    protected function tearDown(): void {
        parent::tearDown();
        $this->cleanUp($this->state);
    }
    public function testInstallFromDirInstallsSiteFromLocalDirectory(): void {
        $state = $this->setupTest();
        $this->makeInstallerTestApp($state);
        $this->invokeInstallFromDirFeature($state);
        $this->verifyFeatureFinishedSuccesfully($state);
        $this->verifyCreatedDbAndSchema($state->getInstallerDb->__invoke());
        $this->verifyPopulatedDb($state->getInstallerDb->__invoke());
        $this->verifyCopiedDefaultSiteFiles($state);
        $this->verifyCopiedUserThemeAndSiteFiles($state);
        $this->verifyCopiedUserThemePublicFiles($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->installerApp = null;
        $state->getInstallerDb = null;
        $state->getTargetSitePath = null;
        $state->spyingResponse = null;
        $this->state = $state;
        return $state;
    }
    private function makeInstallerTestApp(\TestState $state): void {
        $state->installerApp = $this->makeApp(fn() => App::create(self::setGetConfig()), function (Injector $di) use ($state) {
            $di->prepare(Commons::class, function (Commons $instance) use ($state) {
                $instance->setTargetSitePaths(backendRelDirPath: 'install-from-dir-test-backend/',
                                              publicRelDirPath: 'install-from-dir-test-root/public/');
                $state->getTargetSitePath = fn($which = 'site') => $instance->getTargetSitePath($which);
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
    private function verifyCreatedDbAndSchema(Db $installerDb): void {
        $numAffected = $installerDb->exec("INSERT INTO `plugins` (`name`) VALUES (?)", ["test"]);
        $this->assertEquals(1, $numAffected, "Should succeed");
        $installerDb->exec("DELETE FROM `plugins` WHERE `id` = ?", [$installerDb->lastInsertId()]);
    }
    private function verifyPopulatedDb(Db $installerDb): void {
        $actual = $installerDb->fetchOne("SELECT `id` FROM `pageTypes` WHERE `name`=?",
                                         ["Pages"],
                                         \PDO::FETCH_ASSOC);
        $this->assertNotNull($actual);
        $this->assertNotNull((new PageTestUtils($installerDb))->getPage('/'));
    }
    private function verifyCopiedDefaultSiteFiles(\TestState $state): void {
        $a = fn($str) => KUURA_BACKEND_PATH . "installer/sample-content/basic-site/site/{$str}";
        $b = fn($str) => "{$state->getTargetSitePath->__invoke()}{$str}";
        $this->assertFileEquals($a("Site.php"), $b("Site.php"));
        $this->assertFileEquals($a("Theme.php"), $b("Theme.php"));
    }
    private function verifyCopiedUserThemeAndSiteFiles(\TestState $state): void {
        $filesList = Commons::readSneakyJsonData(LocalDirPackage::LOCAL_NAME_PHP_FILES_LIST,
                                                 $this->sitePackage);
        $this->assertCopyedTheseFiles($state, $filesList);
    }
    private function verifyCopiedUserThemePublicFiles(\TestState $state): void {
        $filesList = Commons::readSneakyJsonData(LocalDirPackage::LOCAL_NAME_PUBLIC_FILES_LIST,
                                                 $this->sitePackage);
        $this->assertCopyedTheseFiles($state, $filesList, 'public');
    }
    private function assertCopyedTheseFiles(\TestState $state, array $filesList, string $into = 'site'): void {
        $a = fn($str) => KUURA_BACKEND_PATH . "installer/sample-content/basic-site/{$str}";
        $where = dirname($state->getTargetSitePath->__invoke($into)) . '/';
        $b = fn($str) => "{$where}{$str}";
        foreach ($filesList as $relFilePath)
            $this->assertFileEquals($a($relFilePath), $b($relFilePath));
    }
    private function cleanUp(\TestState $state): void {
        $actualConfig = Commons::readSneakyJsonData(LocalDirPackage::LOCAL_NAME_MAIN_CONFIG,
                                                    $this->sitePackage);
        foreach ($actualConfig as $key => $_)
            $actualConfig[$key] = str_replace('${targetSitePath}',
                                              $state->getTargetSitePath->__invoke(),
                                              $actualConfig[$key]);
        $installerDb = $state->getInstallerDb->__invoke();
        if ($installerDb->attr(\PDO::ATTR_DRIVER_NAME) === "sqlite") {
            $this->fs->unlink(substr($actualConfig["db.connPath"], strlen("sqlite:")));
        } else {
            $installerDb->exec("DROP DATABASE `{$actualConfig["db.database"]}`");
        }
        // .../kuura/backend/install-from-dir-test-backend/
        $this->deleteFilesRecursive($state->getTargetSitePath->__invoke('backend'));
        // .../Applications/MAMP/htdocs/kuura/install-from-dir-test-root/public/
        $withPublic = $state->getTargetSitePath->__invoke('public');
        $this->deleteFilesRecursive(dirname($withPublic) . "/");
    }
    private function deleteFilesRecursive(string $dirPath): ?string {
        foreach ($this->fs->readDir($dirPath) as $path) {
            if ($this->fs->isFile($path)) {
                if (!$this->fs->unlink($path)) return $path;
            } elseif (($failedItem = $this->deleteFilesRecursive($path))) {
                return $failedItem;
            }
        }
        return $this->fs->rmDir($dirPath) ? null : $dirPath;
    }
}
