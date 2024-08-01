<?php declare(strict_types=1);

namespace Sivujetti\Installer;

use Pike\{Db, FileSystem, PikeException};
use Pike\Auth\Authenticator;
use Pike\Db\FluentDb2;
use Sivujetti\Auth\ACL;
use Sivujetti\TheWebsite\Exporter;
use Sivujetti\Update\{PackageStreamInterface, Updater};
use Sivujetti\ValidationUtils;

final class Commons {
    /** @var \Pike\Db */
    private Db $db;
    /** @var \Pike\FileSystem */
    private FileSystem $fs;
    /** @var string Mainly for tests */
    private string $targetSiteBackendPath;
    /** @var string */
    private string $targetSiteIndexPath;
    /**
     * @param \Pike\FileSystem $fs
     */
    public function __construct(FileSystem $fs) {
        self::checkEnvRequirementsAreMetOrDie();
        $this->fs = $fs;
        $this->targetSiteBackendPath = SIVUJETTI_BACKEND_PATH;
        $this->targetSiteIndexPath = SIVUJETTI_INDEX_PATH;
    }
    /**
     * @throws \Pike\PikeException
     */
    public function createTargetSiteDirs(): void {
        foreach (["{$this->targetSiteBackendPath}site/templates",
                  "{$this->targetSiteIndexPath}public/uploads"] as $path) {
            if (!$this->fs->isDir($path) && !$this->fs->mkDir($path))
                throw new PikeException("Failed to create `{$path}`",
                                        PikeException::FAILED_FS_OP);
        }
    }
    /**
     * @param array $config
     */
    public function createOrOpenDb(array $config): void {
        $this->db = new Db($config);
        $this->db->open(); // @allow \Pike\PikeException
    }
    /**
     */
    public function createMainSchema(): void {
        $driver = $this->db->attr(\PDO::ATTR_DRIVER_NAME);
        $statements = require SIVUJETTI_BACKEND_PATH . "installer/schema.{$driver}.php";
        $this->runManyDbStatements($statements, $driver === "sqlite");
    }
    /**
     * @param \Sivujetti\Update\PackageStreamInterface $package
     * @param array $config
     */
    public function populateDb(PackageStreamInterface $package, array $config): void {
        $localName = PackageStreamInterface::LOCAL_NAME_DB_DATA;
        $bundles = Updater::readSneakyJsonData($localName, $package);
        $this->insertManyTableBundles($bundles, $config);
    }
    /**
     * @param array $config
     * @throws \Pike\PikeException
     */
    public function createUserZero(array $config): void {
        [$qList, $values, $columns] = $this->db->makeInsertQParts((object) [
            "id"               => $config["initialUserId"],
            "username"         => $config["initialUserUsername"],
            "email"            => $config["initialUserEmail"],
            "passwordHash"     => $config["initialUserPasswordHash"],
            "role"             => ACL::ROLE_SUPER_ADMIN,
            "accountStatus"    => Authenticator::ACCOUNT_STATUS_ACTIVATED,
            "accountCreatedAt" => time(),
            "role"             => ACL::ROLE_SUPER_ADMIN,
            "loginData"        => "",
        ]);
        // @allow \Pike\PikeException
        if ($this->db->exec("INSERT INTO `\${p}users` ({$columns}) VALUES ({$qList})",
                            $values) !== 1)
            throw new PikeException("Failed to insert user zero",
                                    PikeException::INEFFECTUAL_DB_OP);
    }
    /**
     * @param \Sivujetti\Update\PackageStreamInterface $package
     * @param array $config
     */
    public function writeFiles(PackageStreamInterface $package, array $config): void {
        $this->writeDefaultFiles($package); // @allow \Pike\PikeException
        $this->writeSiteSourceFiles($package); // @allow \Pike\PikeException
        $this->writePublicFiles($package); // @allow \Pike\PikeException
        $this->generateAndWriteConfigFile($config); // @allow \Pike\PikeException
    }
    /**
     * @param array $config
     */
    private function generateAndWriteConfigFile(array $config): void {
        if (!$this->fs->write(
            "{$this->targetSiteIndexPath}config.php",
"<?php

return [
    'app' => [
        'BASE_URL'    => '{$config["baseUrl"]}',
        'QUERY_VAR'   => '{$config["mainQueryVar"]}',
        'SITE_SECRET' => '{$config["secret"]}',
        'UPDATE_KEY'  => '{$config["updateKey"]}',
    ],
    'app' => [
" . ($config["db.driver"] === "sqlite" ?
"        'db.driver'      => 'sqlite',
        'db.database'    => '".str_replace(SIVUJETTI_BACKEND_PATH, "'.SIVUJETTI_BACKEND_PATH.'",$config["db.database"])."',
        'db.tablePrefix' => ''," :
"        'db.driver'      => 'mysql',
        'db.host'        => '{$config["db.host"]}',
        'db.database'    => '{$config["db.database"]}',
        'db.user'        => '{$config["db.user"]}',
        'db.pass'        => '{$config["db.pass"]}',
        'db.tablePrefix' => '{$config["db.tablePrefix"]}',
        'db.charset'     => '{$config["db.charset"]}',") . "
    ]
];
"
        )) throw new PikeException("Failed to generate `{$this->targetSiteIndexPath}config.php`",
                                   PikeException::FAILED_FS_OP);
    }
    /**
     * @return string
     */
    public function getTargetSitePath(string $which = "site"): string {
        return match ($which) {
            "backend" => $this->targetSiteBackendPath,
            "index" => $this->targetSiteIndexPath,
            default => "{$this->targetSiteBackendPath}site/",
        };
    }
    /**
     * @param ?string $backendRelDirPath = SIVUJETTI_BACKEND_PATH
     * @param ?string $serverIndexRelDirPath = SIVUJETTI_INDEX_PATH
     * @throws \Pike\PikeException If path is not valid
     */
    public function setTargetSitePaths(?string $backendRelDirPath = null,
                                       ?string $serverIndexRelDirPath = null): void {
        if ($backendRelDirPath) {
            ValidationUtils::checkIfValidaPathOrThrow($backendRelDirPath);
            $this->targetSiteBackendPath = SIVUJETTI_BACKEND_PATH . $backendRelDirPath;
        }
        if ($serverIndexRelDirPath) {
            ValidationUtils::checkIfValidaPathOrThrow($serverIndexRelDirPath);
            $this->targetSiteIndexPath = SIVUJETTI_INDEX_PATH . $serverIndexRelDirPath;
        }
    }
    /**
     * @return \Pike\Db
     */
    public function getDb(): Db {
        return $this->db;
    }
    /**
     * @param \Sivujetti\Update\PackageStreamInterface $package
     */
    private function writeDefaultFiles(PackageStreamInterface $package): void {
        $package->extractMany($this->targetSiteBackendPath,
                              ["\$backend/site/Theme.php", "\$backend/site/Site.php"],
                              PackageStreamInterface::FILE_NS_BACKEND);
    }
    /**
     * @param \Sivujetti\Update\PackageStreamInterface $package
     */
    private function writeSiteSourceFiles(PackageStreamInterface $package): void {
        $localFileNames = Updater::readSneakyJsonData(PackageStreamInterface::LOCAL_NAME_BACKEND_FILES_LIST,
                                                      $package);
        $package->extractMany($this->targetSiteBackendPath, $localFileNames, PackageStreamInterface::FILE_NS_BACKEND);
    }
    /**
     * @param \Sivujetti\Update\PackageStreamInterface $package
     */
    private function writePublicFiles(PackageStreamInterface $package): void {
        $localFileNames = Updater::readSneakyJsonData(PackageStreamInterface::LOCAL_NAME_INDEX_FILES_LIST,
                                                      $package);
        $package->extractMany($this->targetSiteIndexPath, $localFileNames, PackageStreamInterface::FILE_NS_INDEX);
    }
    /**
     * @param string[] $statements
     * @param bool $isSqlite
     */
    private function runManyDbStatements(array $statements, bool $isSqlite): void {
        $tail = $isSqlite ? " TRANSACTION" : "";
        $this->db->exec("BEGIN{$tail}");
        foreach ($statements as $stmt)
            $this->db->exec($stmt);
        $this->db->exec("COMMIT{$tail}");
    }
    /**
     * @psalm-param array<int, array{tableName: string, entities: array<int, object>}> $bundles
     * @param bool $isSqlite
     */
    private function insertManyTableBundles(array $bundles, array $config): void {
        $fluentDb = new FluentDb2($this->db);
        $tail = $config["db.driver"] === "sqlite" ? " TRANSACTION" : "";
        $this->db->exec("BEGIN{$tail}");
        foreach ($bundles as $bundle) { // Note: trust input / assumes that each bundle->tableName, and each field bundle->entities[*] are valid
            $infos = Exporter::describeTableColums($bundle->tableName, $this->db, $config["db.driver"], $config["db.database"]);
            $cols = \array_column($infos, "colName");
            $fluentDb->insert($bundle->tableName)->fields($cols)->values($bundle->entities)->execute();
        }
        $this->db->exec("COMMIT{$tail}");
    }
    /**
     */
    private static function checkEnvRequirementsAreMetOrDie(): void {
        if (version_compare(phpversion(), "8.0.0", "<"))
            die("Sivujetti requires PHP 8.0.0 or later.");
        if (!defined("SODIUM_LIBRARY_VERSION") || !function_exists("sodium_bin2hex"))
            die("Sivujetti requires sodium.");
        if (!function_exists("session_id"))
            die("!function_exists(\"session_id\") for some reason.");
        if (!function_exists("random_bytes"))
            die("!function_exists(\"random_bytes\") for some reason.");
        if (!class_exists("PDO"))
            die("Sivujetti requires PDO.");
        if (!extension_loaded("pdo_mysql") && !extension_loaded("pdo_sqlite"))
            die("pdo_mysql OR pdo_sqlite is required by Sivujetti.");
        foreach (["mbstring", "fileinfo"] as $ext)
            if (!extension_loaded($ext))
                die("{$ext} extension is required by Sivujetti.");
    }
}
