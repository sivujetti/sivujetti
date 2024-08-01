<?php declare(strict_types=1);

namespace Sivujetti\Cli\Tests;

use Pike\Auth\{Authenticator, Crypto};
use Pike\{AppConfig, Db, Injector, PikeException, Request};
use Pike\Db\FluentDb2;
use Pike\Interfaces\FileSystemInterface;
use Pike\TestUtils\{DbTestCase, HttpTestUtils, MockCrypto, SingleConnectionDb};
use Sivujetti\FileSystem;
use Sivujetti\Auth\ACL;
use Sivujetti\Cli\{App, Controller};
use Sivujetti\Cli\Tests\InstallCmsFromDirTest as TestsInstallCmsFromDirTest;
use Sivujetti\Installer\{Commons, LocalDirPackage};
use Sivujetti\Tests\Utils\PageTestUtils;
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
        $this->sitePackage->open(SIVUJETTI_BACKEND_PATH . "installer/sample-content/minimal");
    }
    protected function tearDown(): void {
        parent::tearDown();
        $this->cleanUp($this->state);
    }
    public static function getDbConfig(): array {
        return (require TEST_CONFIG_FILE_PATH)["app"];
    }
    public function testInstallFromDirInstallsSiteFromLocalDirectory(): void {
        $state = $this->setupTest((object) [
            "initialUserUsername" => "username",
            "initialUserEmail" => "e@ma.il",
            "initialUserPassword" => "password",
            "baseUrl" => "/sub-dir/",
        ]);
        $this->makeTestInstallerApp($state);
        $this->invokeInstallFromDirFeature($state);
        $this->verifyFeatureFinishedSuccesfully($state);
        $this->verifyCreatedDbAndSchema($state->getInstallerDb->__invoke());
        $this->verifyPopulatedDb($state->getInstallerDb->__invoke());
        $this->verifyCreatedUserZero($state->getInstallerDb->__invoke(), $state);
        $this->verifyCopiedDefaultSiteFiles($state);
        $this->verifyCopiedUserThemeAndSiteFiles($state);
        $this->verifyCopiedUserThemePublicFiles($state);
        $this->verifyCreatedConfigFile($state);
    }
    private function setupTest(object $input): \TestState {
        $state = new \TestState;
        $state->inputArgs = array_merge([
            $input->initialUserUsername,
            $input->initialUserEmail,
            $input->initialUserPassword,
            "sqlite",
            "-",
            "-",
            "-",
        ], $input->baseUrl ? [
            $input->baseUrl,
        ] : []);
        $state->installerApp = null;
        $state->getInstallerDb = null;
        $state->getTargetSitePath = null;
        $state->spyingResponse = null;
        $state->testTargetBaseUrl = null;
        $this->state = $state;
        return $state;
    }
    private function makeTestInstallerApp(\TestState $state): void {
        $state->installerApp = $this->buildApp(new App(new class($state, self::$db) {
            public function __construct(
                private \TestState $state,
                private Db $testDb
            ) { }
            public function init(\Pike\Router $r) {
                //
            }
            public function beforeExecCtrl(Injector $di): void {
                $di->share(new AppConfig(TestsInstallCmsFromDirTest::getDbConfig()));
                $di->share($this->testDb);
                $di->alias(Db::class, SingleConnectionDb::class);
                $di->share(new FluentDb2($this->testDb));
                $di->alias(FileSystemInterface::class, FileSystem::class);
                $di->prepare(Commons::class, function (Commons $instance) {
                    $instance->setTargetSitePaths(backendRelDirPath: "install-from-dir-test-backend/",
                                                serverIndexRelDirPath: "install-from-dir-test-root/");
                    $this->state->getTargetSitePath = fn($which = "site") => $instance->getTargetSitePath($which);
                    $this->state->getInstallerDb = fn() => $instance->getDb();
                });
                $di->delegate(Crypto::class, fn() => new MockCrypto);
            }
        }));
    }
    private function invokeInstallFromDirFeature(\TestState $state): void {
        $tail = implode("/", array_map("urlencode", $state->inputArgs));
        $state->spyingResponse = $state->installerApp->sendRequest(
            new Request("/install-from-dir/minimal/{$tail}", "PSEUDO:CLI"));
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
        $actual = $installerDb->fetchOne("SELECT `aclRules`,`firstRuns`,`versionId` FROM `theWebsite` LIMIT 1",
                                         [],
                                         \PDO::FETCH_ASSOC);
        $this->assertNotNull($actual);
        $this->assertStringStartsWith("{\"resources\":",
                                      $actual["aclRules"]);
        $this->assertEquals("{}", $actual["firstRuns"]);
        $this->assertEquals(8, strlen($actual["versionId"]));
    }
    private function verifyCreatedUserZero(Db $installerDb, \TestState $state): void {
        [$expectedUsername, $expectedEmail, $inputPassword] = $state->inputArgs;
        $expectedPasswordHash = (new MockCrypto)->hashPass($inputPassword);
        $actual = $installerDb->fetchOne("SELECT * FROM `users` WHERE `username`=?",
                                         [$expectedUsername],
                                         \PDO::FETCH_ASSOC);
        $this->assertNotNull($actual);
        $this->assertEquals((new MockCrypto)->guidv4(), $actual["id"]);
        $this->assertEquals($expectedUsername, $actual["username"]);
        $this->assertEquals($expectedEmail, $actual["email"]);
        $this->assertEquals($expectedPasswordHash, $actual["passwordHash"]);
        $this->assertEquals(ACL::ROLE_SUPER_ADMIN, $actual["role"]);
        $this->assertEquals(Authenticator::ACCOUNT_STATUS_ACTIVATED, $actual["accountStatus"]);
        $this->assertTrue($actual["accountCreatedAt"] > time() - 20);
    }
    private function verifyCopiedDefaultSiteFiles(\TestState $state): void {
        $a = fn($str) => SIVUJETTI_BACKEND_PATH . "installer/sample-content/minimal/\$backend/site/{$str}";
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
        $this->assertCopiedTheseFiles($state, $filesList, "index");
    }
    private function verifyCreatedConfigFile(\TestState $state): void {
        $actualConfig = $this->_createConfig($state);
        $expectedBaseUrl = $state->inputArgs[7] ?? "/";
        $this->assertStringEqualsFile("{$state->getTargetSitePath->__invoke("index")}config.php",
            "<?php\r\n" .
            "\r\n" .
            "return [\r\n" .
            "    'env' => [\r\n" .
            "        'BASE_URL'    => '{$expectedBaseUrl}',\r\n" .
            "        'QUERY_VAR'   => '{$actualConfig['mainQueryVar']}',\r\n" .
            "        'SITE_SECRET' => '{$actualConfig['secret']}',\r\n" .
            "        'UPDATE_KEY'  => '{$actualConfig['updateKey']}',\r\n" .
            "    ],\r\n" .
            "    'app' => [\r\n" .
            "        'db.driver'      => '{$actualConfig["db.driver"]}',\r\n" .
            "        'db.database'    => '".str_replace(SIVUJETTI_BACKEND_PATH, "'.SIVUJETTI_BACKEND_PATH.'",$actualConfig["db.database"])."',\r\n" .
            "        'db.tablePrefix' => '',\r\n" .
            "    ]\r\n" .
            "];\r\n"
        );
    }
    private function assertCopiedTheseFiles(\TestState $state, array $filesList, string $into = "site"): void {
        $a = fn($str) => SIVUJETTI_BACKEND_PATH . "installer/sample-content/minimal/{$str}";
        $where = $state->getTargetSitePath->__invoke($into);
        $where = $into !== "index" ? (dirname($where) . "/") : $where;
        $b = fn($str) => "{$where}{$str}";
        foreach ($filesList as $nsdRelFilePath) {
            $unPrefixified = str_replace([PackageStreamInterface::FILE_NS_BACKEND,
                                          PackageStreamInterface::FILE_NS_INDEX], "", $nsdRelFilePath);
            $this->assertFileEquals($a($nsdRelFilePath), $b($unPrefixified));
        }
    }
    private function cleanUp(\TestState $state): void {
        try {
        $actualConfig = $this->_createConfig($state);
        } catch (PikeException $e) {
            $username = $state->inputArgs[0];
            $isValidationTest = $username === "";
            if (!$isValidationTest) throw $e;
            else return;
        }
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
        $dir2 = $state->getTargetSitePath->__invoke("index");
        $this->fs->deleteFilesRecursive($dir2, SIVUJETTI_INDEX_PATH);
    }
    private function _createConfig(\TestState $state): array {
        $actualConfig = Controller::createConfigOrThrow($state->inputArgs, new MockCrypto);
        foreach ($actualConfig as $key => $_)
            $actualConfig[$key] = str_replace("\${SIVUJETTI_BACKEND_PATH}",
                                              $state->getTargetSitePath->__invoke("backend"),
                                              $actualConfig[$key]);
        return $actualConfig;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testInstallFromDirValidatesCredentialsFromInput(): void {
        $state = $this->setupTest((object) [
            "initialUserUsername" => "",
            "initialUserEmail" => "",
            "initialUserPassword" => "2short",
            "baseUrl" => null,
        ]);
        $this->makeTestInstallerApp($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage(implode(PHP_EOL, [
            "The length of username must be at least 2",
            "The value of email did not pass the regexp",
            "The length of password must be at least 8",
        ]));
        $this->invokeInstallFromDirFeature($state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testInstallFromDirUsesDefaults(): void {
        $state = $this->setupTest((object) [
            "initialUserUsername" => "username",
            "initialUserEmail" => "e@ma.il",
            "initialUserPassword" => "password",
            "baseUrl" => null,
        ]);
        $this->makeTestInstallerApp($state);
        $this->invokeInstallFromDirFeature($state);
        $this->verifyFeatureFinishedSuccesfully($state);
        $this->verifyCreatedDbAndSchema($state->getInstallerDb->__invoke());
        $this->verifyPopulatedDb($state->getInstallerDb->__invoke());
        $this->verifyCreatedUserZero($state->getInstallerDb->__invoke(), $state);
        $this->verifyCopiedDefaultSiteFiles($state);
        $this->verifyCopiedUserThemeAndSiteFiles($state);
        $this->verifyCopiedUserThemePublicFiles($state);
        $this->verifyCreatedConfigFile($state);
    }
}
