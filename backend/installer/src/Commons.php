<?php declare(strict_types=1);

namespace KuuraCms\Installer;

use KuuraCms\ValidationUtils;
use Pike\{Db, FileSystem, PikeException};

final class Commons {
    /** @var \Pike\Db */
    private Db $db;
    /** @var \Pike\FileSystem */
    private FileSystem $fs;
    /** @var string Mainly for tests */
    private string $targetSiteBackendPath;
    /** @var string */
    private string $targetSitePublicPath;
    /**
     * @param \Pike\FileSystem $fs
     */
    public function __construct(FileSystem $fs) {
        self::checkEnvRequirementsAreMetOrDie();
        $this->fs = $fs;
        $this->targetSiteBackendPath = KUURA_BACKEND_PATH;
        $this->targetSitePublicPath = KUURA_PUBLIC_PATH;
    }
    /**
     * @throws \Pike\PikeException
     */
    public function createTargetSiteDirs(): void {
        foreach (["{$this->targetSiteBackendPath}site/templates",
                  "{$this->targetSitePublicPath}uploads"] as $path) {
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
        $statements = require KUURA_BACKEND_PATH . "installer/schema.{$driver}.php";
        $this->runManyDbStatements($statements);
    }
    /**
     * @param \KuuraCms\Installer\PackageStreamInterface $package
     */
    public function populateDb(PackageStreamInterface $package): void {
        $statements = self::readSneakyJsonData(PackageStreamInterface::LOCAL_NAME_DB_DATA,
                                               $package);
        $this->runManyDbStatements($statements);
    }
    /**
     * @param \KuuraCms\Installer\PackageStreamInterface $package
     */
    public function writeFiles(PackageStreamInterface $package): void {
        $this->writeDefaultFiles($package); // @allow \Pike\PikeException
        $this->writeSiteSourceFiles($package); // @allow \Pike\PikeException
        $this->writePublicFiles($package); // @allow \Pike\PikeException
    }
    /**
     * @param string $sneakyJsonFileLocalName
     * @param \KuuraCms\Installer\PackageStreamInterface $package
     * @return array|object Parsed json data
     */
    public static function readSneakyJsonData(string $sneakyJsonFileLocalName,
                                              PackageStreamInterface $package): array|object {
        if (!is_string(($str = $package->read($sneakyJsonFileLocalName))))
            throw new PikeException("Failed to read `{$sneakyJsonFileLocalName}`",
                                    PikeException::FAILED_FS_OP);
        if (!($parsed = json_decode(substr($str, strlen("<?php // ")),
                                    associative: true,
                                    flags: JSON_THROW_ON_ERROR)) === null)
            throw new PikeException("Failed to parse the contents of `{$sneakyJsonFileLocalName}`",
                                    PikeException::BAD_INPUT);
        return $parsed;
    }
    /**
     * @return string
     */
    public function getTargetSitePath(string $which = 'site'): string {
        return match ($which) {
            'backend' => $this->targetSiteBackendPath,
            'public' => $this->targetSitePublicPath,
            default => "{$this->targetSiteBackendPath}site/",
        };
    }
    /**
     * @param ?string $backendRelDirPath = KUURA_BACKEND_PATH
     * @param ?string $publicRelDirPath = KUURA_PUBLIC_PATH
     * @throws \Pike\PikeException If path is not valid
     */
    public function setTargetSitePaths(?string $backendRelDirPath = null,
                                       ?string $publicRelDirPath = null): void {
        if ($backendRelDirPath) {
            ValidationUtils::checkIfValidaPathOrThrow($backendRelDirPath);
            $this->targetSiteBackendPath = KUURA_BACKEND_PATH . $backendRelDirPath;
        }
        if ($publicRelDirPath) {
            ValidationUtils::checkIfValidaPathOrThrow($publicRelDirPath);
            $this->targetSitePublicPath = dirname(KUURA_PUBLIC_PATH) . "/{$publicRelDirPath}";
        }
    }
    /**
     * @param todo 
     */
    public function getDb(): Db {
        return $this->db;
    }
    /**
     * @param \KuuraCms\Installer\PackageStreamInterface $package
     */
    private function writeDefaultFiles(PackageStreamInterface $package): void {
        $package->extractMany($this->targetSiteBackendPath,
                              ["site/Theme.php", "site/Site.php"]);
    }
    /**
     * @param \KuuraCms\Installer\PackageStreamInterface $package
     */
    private function writeSiteSourceFiles(PackageStreamInterface $package): void {
        $localFileNames = self::readSneakyJsonData(PackageStreamInterface::LOCAL_NAME_PHP_FILES_LIST,
                                                   $package);
        $package->extractMany($this->targetSiteBackendPath, $localFileNames);
    }
    /**
     * @param \KuuraCms\Installer\PackageStreamInterface $package
     */
    private function writePublicFiles(PackageStreamInterface $package): void {
        $localFileNames = self::readSneakyJsonData(PackageStreamInterface::LOCAL_NAME_PUBLIC_FILES_LIST,
                                                   $package);
        $package->extractMany(dirname($this->targetSitePublicPath) . '/', $localFileNames);
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
            die("KuuraCMS requires PHP 8.0.0 or later.");
        if (!function_exists("random_bytes"))
            die("!function_exists(\"random_bytes\") for some reason.");
        if (!extension_loaded("pdo_mysql") && !extension_loaded("pdo_sqlite"))
            die("pdo_mysql OR pdo_sqlite is required by KuuraCMS.");
        foreach (["mbstring", "fileinfo"] as $ext)
            if (!extension_loaded($ext))
                die("{$ext} extension is required by KuuraCMS.");
    }
}
