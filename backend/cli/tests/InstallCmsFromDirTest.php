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
        $this->verifyCreatedConfigFile($state);
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
                                              serverRootRelDirPath: 'install-from-dir-test-root/');
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
        $this->assertCopiedTheseFiles($state, $filesList);
    }
    private function verifyCopiedUserThemePublicFiles(\TestState $state): void {
        $filesList = Commons::readSneakyJsonData(LocalDirPackage::LOCAL_NAME_PUBLIC_FILES_LIST,
                                                 $this->sitePackage);
        $this->assertCopiedTheseFiles($state, $filesList, 'serverRoot');
    }
    private function verifyCreatedConfigFile(\TestState $state): void {
        $actualConfig = $this->_getSiteConfig($state);
        $this->assertStringEqualsFile("{$state->getTargetSitePath->__invoke('serverRoot')}config.php",
            "<?php\r\n" .
            "if (!defined('KUURA_BASE_URL')) {\r\n" .
            "    define('KUURA_BASE_URL',  '{$actualConfig['baseUrl']}');\r\n" .
            "    define('KUURA_QUERY_VAR', '{$actualConfig['mainQueryVar']}');\r\n" .
            "    define('KUURA_SECRET',    '{$actualConfig['secret']}');\r\n" .
            "    define('KUURA_DEVMODE',   1 << 1);\r\n" .
            "    define('KUURA_FLAGS',     0);\r\n" .
            "}\r\n" .
            "return [\r\n" .
            "    'db.connPath' => '".str_replace(KUURA_BACKEND_PATH, "'.KUURA_BACKEND_PATH.'",$actualConfig["db.connPath"])."',\r\n" .
            "    'db.tablePrefix' => '',\r\n" .
            "];\r\n"
        );
    }
    private function assertCopiedTheseFiles(\TestState $state, array $filesList, string $into = 'site'): void {
        $a = fn($str) => KUURA_BACKEND_PATH . "installer/sample-content/basic-site/{$str}";
        $where = $state->getTargetSitePath->__invoke($into);
        $where = $into !== 'serverRoot' ? (dirname($where) . "/") : $where;
        $b = fn($str) => "{$where}{$str}";
        foreach ($filesList as $relFilePath)
            $this->assertFileEquals($a($relFilePath), $b($relFilePath));
    }
    private function cleanUp(\TestState $state): void {
        $actualConfig = $this->_getSiteConfig($state);
        $installerDb = $state->getInstallerDb->__invoke();
        if ($installerDb->attr(\PDO::ATTR_DRIVER_NAME) === "sqlite") {
            $this->fs->unlink(substr($actualConfig["db.connPath"], strlen("sqlite:")));
        } else {
            $installerDb->exec("DROP DATABASE `{$actualConfig["db.database"]}`");
        }
        // .../kuura/backend/install-from-dir-test-backend/
        $this->_deleteFilesRecursive($state->getTargetSitePath->__invoke('backend'));
        // .../kuura/install-from-dir-test-root/
        $this->_deleteFilesRecursive($state->getTargetSitePath->__invoke('serverRoot'));
    }
    private function _getSiteConfig(\TestState $state) {
        $actualConfig = Commons::readSneakyJsonData(LocalDirPackage::LOCAL_NAME_MAIN_CONFIG,
                                                    $this->sitePackage);
        foreach ($actualConfig as $key => $_)
            $actualConfig[$key] = str_replace('${KUURA_BACKEND_PATH}',
                                              $state->getTargetSitePath->__invoke('backend'),
                                              $actualConfig[$key]);
        return $actualConfig;
    }
    private function _deleteFilesRecursive(string $dirPath): ?string {
        foreach ($this->fs->readDir($dirPath) as $path) {
            if ($this->fs->isFile($path)) {
                if (!$this->fs->unlink($path)) return $path;
            } elseif (($failedItem = $this->_deleteFilesRecursive($path))) {
                return $failedItem;
            }
        }
        return $this->fs->rmDir($dirPath) ? null : $dirPath;
    }
}
