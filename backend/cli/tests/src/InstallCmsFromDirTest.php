<?php declare(strict_types=1);

namespace Sivujetti\Cli\Tests;

use Auryn\Injector;
use Sivujetti\Cli\App;
use Sivujetti\Installer\{Commons, LocalDirPackage};
use Sivujetti\Tests\Utils\PageTestUtils;
use Pike\{Db, Request};
use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\FileSystem;
use Sivujetti\Update\{PackageStreamInterface, Updater};

final class InstallCmsFromDirTest extends DbTestCase {
    use HttpTestUtils;
    private FileSystem $fs;
    private LocalDirPackage $sitePackage;
    private \TestState $state;
    protected function setUp(): void {
        parent::setUp();
        $this->fs = new FileSystem;
        $this->sitePackage = new LocalDirPackage($this->fs);
        $this->sitePackage->open(SIVUJETTI_BACKEND_PATH . "installer/sample-content/basic-site");
    }
    protected function tearDown(): void {
        parent::tearDown();
        $this->cleanUp($this->state);
    }
    public function testInstallFromDirInstallsSiteFromLocalDirectory(): void {
        $state = $this->setupTest();
        $params = (object) ["baseUrl" => "/foo"];
        $this->makeTestInstallerApp($state);
        $this->invokeInstallFromDirFeature($state, $params);
        $this->verifyFeatureFinishedSuccesfully($state);
        $this->verifyCreatedDbAndSchema($state->getInstallerDb->__invoke());
        $this->verifyPopulatedDb($state->getInstallerDb->__invoke());
        $this->verifyCopiedDefaultSiteFiles($state);
        $this->verifyCopiedUserThemeAndSiteFiles($state);
        $this->verifyCopiedUserThemePublicFiles($state);
        $this->verifyCreatedConfigFile($state, $params);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->installerApp = null;
        $state->getInstallerDb = null;
        $state->getTargetSitePath = null;
        $state->spyingResponse = null;
        $state->testTargetBaseUrl = null;
        $this->state = $state;
        return $state;
    }
    private function makeTestInstallerApp(\TestState $state): void {
        $state->installerApp = $this->makeApp(fn() => App::create(self::setGetConfig()), function (Injector $di) use ($state) {
            $di->prepare(Commons::class, function (Commons $instance) use ($state) {
                $instance->setTargetSitePaths(backendRelDirPath: "install-from-dir-test-backend/",
                                              serverRootRelDirPath: "install-from-dir-test-root/");
                $state->getTargetSitePath = fn($which = "site") => $instance->getTargetSitePath($which);
                $state->getInstallerDb = fn() => $instance->getDb();
            });
        });
    }
    private function invokeInstallFromDirFeature(\TestState $state, object $params): void {
        $tail = $params->baseUrl ? ("/" . urlencode($params->baseUrl)) : "";
        $state->spyingResponse = $state->installerApp->sendRequest(
            new Request("/install-from-dir/basic-site{$tail}", "PSEUDO:CLI"));
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
        $this->assertNotNull((new PageTestUtils($installerDb))->getPageBySlug("/"));
        $actual = $installerDb->fetchOne("SELECT `aclRules` FROM `theWebsite` LIMIT 1",
                                         [],
                                         \PDO::FETCH_ASSOC);
        $this->assertNotNull($actual);
        $this->assertStringStartsWith("{\"resources\":",
                                      $actual["aclRules"]);
    }
    private function verifyCopiedDefaultSiteFiles(\TestState $state): void {
        $a = fn($str) => SIVUJETTI_BACKEND_PATH . "installer/sample-content/basic-site/\$backend/site/{$str}";
        $b = fn($str) => "{$state->getTargetSitePath->__invoke()}{$str}";
        $this->assertFileEquals($a("Site.php"), $b("Site.php"));
        $this->assertFileEquals($a("Theme.php"), $b("Theme.php"));
    }
    private function verifyCopiedUserThemeAndSiteFiles(\TestState $state): void {
        $filesList = Updater::readSneakyJsonData(LocalDirPackage::LOCAL_NAME_BACKEND_FILES_LIST,
                                                 $this->sitePackage);
        $this->assertCopiedTheseFiles($state, $filesList);
    }
    private function verifyCopiedUserThemePublicFiles(\TestState $state): void {
        $filesList = Updater::readSneakyJsonData(LocalDirPackage::LOCAL_NAME_INDEX_FILES_LIST,
                                                 $this->sitePackage);
        $this->assertCopiedTheseFiles($state, $filesList, "serverRoot");
    }
    private function verifyCreatedConfigFile(\TestState $state, object $usedParams): void {
        $actualConfig = $this->_getSiteConfig($state);
        $expectedBaseUrl = $usedParams->baseUrl ?? "/";
        $this->assertStringEqualsFile("{$state->getTargetSitePath->__invoke("serverRoot")}config.php",
            "<?php\r\n" .
            "if (!defined('SIVUJETTI_BASE_URL')) {\r\n" .
            "    define('SIVUJETTI_BASE_URL',  '{$expectedBaseUrl}');\r\n" .
            "    define('SIVUJETTI_QUERY_VAR', '{$actualConfig['mainQueryVar']}');\r\n" .
            "    define('SIVUJETTI_SECRET',    '{$actualConfig['secret']}');\r\n" .
            "    define('SIVUJETTI_DEVMODE',   1 << 1);\r\n" .
            "    define('SIVUJETTI_FLAGS',     SIVUJETTI_DEVMODE);\r\n" .
            "}\r\n" .
            "return [\r\n" .
            "    'db.driver'      => '{$actualConfig["db.driver"]}',\r\n" .
            "    'db.database'    => '".str_replace(SIVUJETTI_BACKEND_PATH, "'.SIVUJETTI_BACKEND_PATH.'",$actualConfig["db.database"])."',\r\n" .
            "    'db.tablePrefix' => '',\r\n" .
            "];\r\n"
        );
    }
    private function assertCopiedTheseFiles(\TestState $state, array $filesList, string $into = "site"): void {
        $a = fn($str) => SIVUJETTI_BACKEND_PATH . "installer/sample-content/basic-site/{$str}";
        $where = $state->getTargetSitePath->__invoke($into);
        $where = $into !== "serverRoot" ? (dirname($where) . "/") : $where;
        $b = fn($str) => "{$where}{$str}";
        foreach ($filesList as $nsdRelFilePath) {
            $unPrefixified = str_replace([PackageStreamInterface::FILE_NS_BACKEND,
                                          PackageStreamInterface::FILE_NS_INDEX], "", $nsdRelFilePath);
            $this->assertFileEquals($a($nsdRelFilePath), $b($unPrefixified));
        }
    }
    private function cleanUp(\TestState $state): void {
        $actualConfig = $this->_getSiteConfig($state);
        $installerDb = $state->getInstallerDb->__invoke();
        if ($installerDb->attr(\PDO::ATTR_DRIVER_NAME) === "sqlite") {
            $this->fs->unlink($actualConfig["db.database"]);
        } else {
            $installerDb->exec("DROP DATABASE `{$actualConfig["db.database"]}`");
        }
        // .../sivujetti/backend/install-from-dir-test-backend/
        $dir = $state->getTargetSitePath->__invoke("backend");
        $this->fs->deleteFilesRecursive($dir, SIVUJETTI_BACKEND_PATH);
        // .../sivujetti/install-from-dir-test-root/
        $dir2 = $state->getTargetSitePath->__invoke("serverRoot");
        $this->fs->deleteFilesRecursive($dir2, SIVUJETTI_PUBLIC_PATH);
    }
    private function _getSiteConfig(\TestState $state) {
        $actualConfig = Updater::readSneakyJsonData(LocalDirPackage::LOCAL_NAME_MAIN_CONFIG,
                                                    $this->sitePackage,
                                                    associative: true);
        foreach ($actualConfig as $key => $_)
            $actualConfig[$key] = str_replace("\${SIVUJETTI_BACKEND_PATH}",
                                              $state->getTargetSitePath->__invoke("backend"),
                                              $actualConfig[$key]);
        return $actualConfig;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testInstallFromDirUsesDefaults(): void {
        $state = $this->setupTest();
        $params = (object) ["baseUrl" => null];
        $this->makeTestInstallerApp($state);
        $this->invokeInstallFromDirFeature($state, $params);
        $this->verifyFeatureFinishedSuccesfully($state);
        $this->verifyCreatedDbAndSchema($state->getInstallerDb->__invoke());
        $this->verifyPopulatedDb($state->getInstallerDb->__invoke());
        $this->verifyCopiedDefaultSiteFiles($state);
        $this->verifyCopiedUserThemeAndSiteFiles($state);
        $this->verifyCopiedUserThemePublicFiles($state);
        $this->verifyCreatedConfigFile($state, $params);
    }
}
