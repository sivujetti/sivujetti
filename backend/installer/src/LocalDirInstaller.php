<?php declare(strict_types=1);

namespace KuuraCms\Installer;

use Pike\Interfaces\FileSystemInterface;

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
     * Installs KuuraCms from local directory KUURA_BACKEND_PATH . "installer/
     * sample-content/{$relDirPath}/" to KUURA_BACKEND_PATH . "site".
     */
    public function doInstall(string $relDirPath): void {
        $package = new LocalDirPackage($this->fs);
        $package->open($relDirPath); // @allow \Pike\PikeException
        $config = Commons::readSneakyJsonData($package::LOCAL_NAME_MAIN_CONFIG, $package);
        foreach ($config as $key => $_)
            $config[$key] = str_replace("\${KUURA_BACKEND_PATH}",
                                        $this->commons->getTargetSitePath('backend'),
                                        $config[$key]);
        $this->commons->createTargetSiteDirs(); // @allow \Pike\PikeException
        $this->commons->createOrOpenDb($config); // @allow \Pike\PikeException
        $this->commons->createMainSchema(); // @allow \Pike\PikeException
        $this->commons->populateDb($package); // @allow \Pike\PikeException
        $this->commons->writeFiles($package, $config); // @allow \Pike\PikeException
    }
}
