<?php declare(strict_types=1);

namespace Sivujetti\Installer;

use Pike\{Db, FileSystem, PikeException};
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
    private string $targetSiteServerRoot;
    /**
     * @param \Pike\FileSystem $fs
     */
    public function __construct(FileSystem $fs) {
        self::checkEnvRequirementsAreMetOrDie();
        $this->fs = $fs;
        $this->targetSiteBackendPath = SIVUJETTI_BACKEND_PATH;
        $this->targetSiteServerRoot = SIVUJETTI_PUBLIC_PATH;
    }
    /**
     * @throws \Pike\PikeException
     */
    public function createTargetSiteDirs(): void {
        foreach (["{$this->targetSiteBackendPath}site/templates",
                  "{$this->targetSiteServerRoot}public/uploads"] as $path) {
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
        $this->runManyDbStatements($statements);
    }
    /**
     * @param \Sivujetti\Update\PackageStreamInterface $package
     */
    public function populateDb(PackageStreamInterface $package): void {
        $statements = Updater::readSneakyJsonData(PackageStreamInterface::LOCAL_NAME_DB_DATA,
                                                  $package);
        $this->runManyDbStatements($statements);
    }
    /**
     * @param \Sivujetti\Update\PackageStreamInterface $package
     * @param array $config
     */
    public function writeFiles(PackageStreamInterface $package,
                               array $config): void {
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
            "{$this->targetSiteServerRoot}config.php",
"<?php
if (!defined('SIVUJETTI_BASE_URL')) {
    define('SIVUJETTI_BASE_URL',  '{$config["baseUrl"]}');
    define('SIVUJETTI_QUERY_VAR', '{$config["mainQueryVar"]}');
    define('SIVUJETTI_SECRET',    '{$config["secret"]}');
    define('SIVUJETTI_DEVMODE',   1 << 1);
    define('SIVUJETTI_FLAGS',     0);
}
return [
" . (($config["db.driver"] ?? "") === "sqlite" ?
"    'db.driver'      => 'sqlite',
    'db.database'    => '".str_replace(SIVUJETTI_BACKEND_PATH, "'.SIVUJETTI_BACKEND_PATH.'",$config["db.database"])."',
    'db.tablePrefix' => ''," :
"    'db.host'        => '{$config["db.host"]}',
    'db.database'    => '{$config["db.database"]}',
    'db.user'        => '{$config["db.user"]}',
    'db.pass'        => '{$config["db.pass"]}',
    'db.tablePrefix' => '{$config["db.tablePrefix"]}',
    'db.charset'     => '{$config["db.charset"]}',") . "
];
"
        )) throw new PikeException("Failed to generate `{$this->targetSiteServerRoot}config.php`",
                                   PikeException::FAILED_FS_OP);
    }
    /**
     * @return string
     */
    public function getTargetSitePath(string $which = "site"): string {
        return match ($which) {
            "backend" => $this->targetSiteBackendPath,
            "serverRoot" => $this->targetSiteServerRoot,
            default => "{$this->targetSiteBackendPath}site/",
        };
    }
    /**
     * @param ?string $backendRelDirPath = SIVUJETTI_BACKEND_PATH
     * @param ?string $serverRootRelDirPath = SIVUJETTI_PUBLIC_PATH
     * @throws \Pike\PikeException If path is not valid
     */
    public function setTargetSitePaths(?string $backendRelDirPath = null,
                                       ?string $serverRootRelDirPath = null): void {
        if ($backendRelDirPath) {
            ValidationUtils::checkIfValidaPathOrThrow($backendRelDirPath);
            $this->targetSiteBackendPath = SIVUJETTI_BACKEND_PATH . $backendRelDirPath;
        }
        if ($serverRootRelDirPath) {
            ValidationUtils::checkIfValidaPathOrThrow($serverRootRelDirPath);
            $this->targetSiteServerRoot = SIVUJETTI_PUBLIC_PATH . $serverRootRelDirPath;
        }
    }
    /**
     * @param todo 
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
        $package->extractMany($this->targetSiteServerRoot, $localFileNames, PackageStreamInterface::FILE_NS_INDEX);
    }
    /**
     * @param array $statements
     */
    private function runManyDbStatements(array $statements): void {
        $this->db->exec("BEGIN TRANSACTION");
        foreach ($statements as $stmt)
            $this->db->exec($stmt);
        $this->db->exec("COMMIT TRANSACTION");
    }
    /**
     */
    private static function checkEnvRequirementsAreMetOrDie(): void {
        if (version_compare(phpversion(), "8.0.0", "<"))
            die("Sivujetti requires PHP 8.0.0 or later.");
        if (!function_exists("random_bytes"))
            die("!function_exists(\"random_bytes\") for some reason.");
        if (!extension_loaded("pdo_mysql") && !extension_loaded("pdo_sqlite"))
            die("pdo_mysql OR pdo_sqlite is required by Sivujetti.");
        foreach (["mbstring", "fileinfo"] as $ext)
            if (!extension_loaded($ext))
                die("{$ext} extension is required by Sivujetti.");
    }
}
