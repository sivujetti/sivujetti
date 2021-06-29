<?php declare(strict_types=1);

namespace KuuraCms\Installer;

use KuuraCms\ValidationUtils;
use Pike\Db;
use Pike\FileSystem;
use Pike\PikeException;

final class Commons {
    /** @var \Pike\Db */
    private Db $db;
    /** @var \Pike\FileSystem */
    private FileSystem $fs;
    /** @var string Mainly for tests */
    private string $targetSitePath;
    /**
     * @param \Pike\FileSystem $fs
     * @param ?string $targetSitePath = null
     */
    public function __construct(FileSystem $fs,
                                ?string $targetSitePath = null) {
        self::checkEnvRequirementsAreMetOrDie();
        $this->fs = $fs;
        $this->targetSitePath = $targetSitePath ?? KUURA_BACKEND_PATH . "site/";
    }
    /**
     * @throws \Pike\PikeException
     */
    public function createTargetSiteDirs(): void {
        foreach (["{$this->targetSitePath}templates"] as $path) {
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
     * @param array $config
     */
    public function createMainSchema(array $config): void {
        $driver = $this->db->attr(\PDO::ATTR_DRIVER_NAME);
        $path = KUURA_BACKEND_PATH . "installer/schema.{$driver}.sql";
        $sql = $this->fs->read($path);
        if (!$sql) throw new PikeException("Failed to read `{$path}`",
                                           PikeException::FAILED_FS_OP);
        if ($driver === "sqlite") {
            $pcs = explode("CREATE TABLE", $sql);
            $drops = explode(";", array_shift($pcs));
            $this->db->runInTransaction(function () use ($drops) {
                foreach ($drops as $drop) {
                    if (strpos($drop, "DROP") === -1) break;
                    $this->db->exec($drop);
                }
            });
            $this->db->runInTransaction(function () use ($pcs) {
                foreach ($pcs as $create)
                    $this->db->exec("CREATE TABLE {$create}");
            });
        } else {
            $this->db->attr(\PDO::ATTR_EMULATE_PREPARES, 1);
            $sql = str_replace("\${database}", $config["db.database"], $sql);
            $this->db->exec($sql); // @allow \Pike\PikeException
            $this->db->attr(\PDO::ATTR_EMULATE_PREPARES, 0);
        }
    }
    /**
     * @param \KuuraCms\Installer\PackageStreamInterface $package
     */
    public function writeFiles(PackageStreamInterface $package): void {
        $this->writeDefaultFiles($package); // @allow \Pike\PikeException
        $this->writeSiteAndThemeFiles($package); // @allow \Pike\PikeException
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
    public function getTargetSitePath(): string {
        return $this->targetSitePath;
    }
    /**
     * @param string $relDirPath
     * @throws \Pike\PikeException If $relPath is not valid
     */
    public function setTargetSitePath(string $relDirPath): void {
        ValidationUtils::checkIfValidaPathOrThrow($relDirPath);
        $this->targetSitePath = KUURA_BACKEND_PATH . $relDirPath;
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
        $package->extractMany($this->targetSitePath, ["site/Theme.php", "site/Site.php"]);
    }
    /**
     * @param \KuuraCms\Installer\PackageStreamInterface $package
     */
    private function writeSiteAndThemeFiles(PackageStreamInterface $package): void {
        $localFileNames = self::readSneakyJsonData(PackageStreamInterface::LOCAL_NAME_PHP_FILES_LIST,
                                                   $package);
        $package->extractMany($this->targetSitePath, $localFileNames);
    }
    /**
     * @access private
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
