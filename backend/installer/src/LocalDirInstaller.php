<?php declare(strict_types=1);

namespace KuuraCms\Installer;

use Pike\Interfaces\FileSystemInterface;
use Pike\PikeException;

final class LocalDirInstaller {
    /** @var \Pike\Interfaces\FileSystemInterface */
    private FileSystemInterface $fs;
    /** @var \KuuraCms\Installer\Commons */
    private Commons $commons;
    /**
     * @param \Pike\Interfaces\FileSystemInterface $fs
     * @param \KuuraCms\Installer\Commons $commons
     */
    public function __construct(FileSystemInterface $fs, Commons $commons) {
        $this->fs = $fs;
        $this->commons = $commons;
    }
    /**
     * Installs KuuraCms from local directory KUURA_BACKEND_PATH . "installer/sample-content/{$relDirPath}/"
     */
    public function doInstall(string $relDirPath): void {
        $package = new LocalDirPackage($this->fs);
        $package->open($relDirPath); // @allow \Pike\PikeException
        if (!is_string(($str = $package->read("config.php"))))
            throw new PikeException("Failed to read `config.php`",
                                    PikeException::FAILED_FS_OP);
        if (!is_array(($config = json_decode(substr($str, strlen("<?php // ")), associative: true, flags: JSON_THROW_ON_ERROR))))
            throw new PikeException("Failed to parse the contents of config.php",
                                    PikeException::BAD_INPUT);
        foreach ($config as $key => $_)
            $config[$key] = str_replace("\${targetSitePath}",
                                        $this->commons->getTargetSitePath(),
                                        $config[$key]);
        $this->commons->createTargetSiteDirs(); // @allow \Pike\PikeException
        $this->commons->createOrOpenDb($config); // @allow \Pike\PikeException
        $this->commons->createMainSchema($config); // @allow \Pike\PikeException
    }
}
