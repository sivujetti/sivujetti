<?php declare(strict_types=1);

namespace Sivujetti\Installer;

use Pike\Interfaces\FileSystemInterface;
use Sivujetti\Update\Updater;

final class LocalDirInstaller {
    /** @var \Pike\Interfaces\FileSystemInterface */
    private FileSystemInterface $fs;
    /** @var \Sivujetti\Installer\Commons */
    private Commons $commons;
    /**
     * @param \Pike\Interfaces\FileSystemInterface $fs
     * @param \Sivujetti\Installer\Commons $commons
     */
    public function __construct(FileSystemInterface $fs, Commons $commons) {
        $this->fs = $fs;
        $this->commons = $commons;
    }
    /**
     * Installs Sivujetti from local directory SIVUJETTI_BACKEND_PATH . "installer/
     * sample-content/{$relDirPath}/" to SIVUJETTI_BACKEND_PATH . "site".
     *
     * @param string $relDirPath e.g. "basic-site"
     * @param string $baseUrl e.g. "/"
     */
    public function doInstall(string $relDirPath, string $baseUrl): void {
        $package = new LocalDirPackage($this->fs);
        $package->open(SIVUJETTI_BACKEND_PATH . "installer/sample-content/" . $relDirPath); // @allow \Pike\PikeException
        $config = Updater::readSneakyJsonData($package::LOCAL_NAME_MAIN_CONFIG,
                                              $package,
                                              associative: true);
        foreach ($config as $key => $_)
            $config[$key] = str_replace("\${SIVUJETTI_BACKEND_PATH}",
                                        $this->commons->getTargetSitePath('backend'),
                                        $config[$key]);
        $config["baseUrl"] = str_replace("\${baseUrl}",
                                         $baseUrl,
                                         $config["baseUrl"]);
        $this->commons->createTargetSiteDirs(); // @allow \Pike\PikeException
        $this->commons->createOrOpenDb($config); // @allow \Pike\PikeException
        $this->commons->createMainSchema(); // @allow \Pike\PikeException
        $this->commons->populateDb($package); // @allow \Pike\PikeException
        $this->commons->writeFiles($package, $config); // @allow \Pike\PikeException
    }
}
