<?php declare(strict_types=1);

namespace Sivujetti\Cli;

use Sivujetti\Installer\PackageStreamInterface;

final class Bundler {
    /** @var \Closure fn(...$args) => string */
    private \Closure $doPrint;
    /** @var string SIVUJETTI_BACKEND_PATH */
    private string $sivujettiBackendPath;
    /** @var string SIVUJETTI_PUBLIC_PATH */
    private string $sivujettiPublicPath;
    /**
     * @param \Sivujetti\Installer\PackageStreamInterface $to
     * @param string $fileOrDirPath
     * @param \Closure $printFn function ($msg) { echo $msg . PHP_EOL; }
     */
    public function makeRelease(PackageStreamInterface $to,
                                string $fileOrDirPath,
                                ?\Closure $printFn = null): string {
        $this->doPrint = $printFn ?? function ($msg) { echo $msg . PHP_EOL; };
        $this->shellExecFn = $shellExecFn ?? "\shell_exec";
        $this->sivujettiBackendPath = SIVUJETTI_BACKEND_PATH;
        $this->sivujettiPublicPath = SIVUJETTI_PUBLIC_PATH;
        //
        $to->open($fileOrDirPath, true);
        $this->writeSourceFiles($to);
        return $to->getResult();
    }
    /**
     */
    private function writeSourceFiles(PackageStreamInterface $out): void {
        $this->doPrint->__invoke("Writing files to output stream...");
        $this->writeBackendFiles($out);
        $this->doPrint->__invoke("Done.");
    }
    /**
     * @throws \Pike\PikeException
     */
    private function writeBackendFiles(PackageStreamInterface $out): void {
        foreach (["backend/composer.json", "index.php", "LICENSE"] as $f)
            // @allow \Pike\PikeException
            $out->addFile("{$this->sivujettiPublicPath}{$f}", $f);
        foreach (["composer.json"] as $f)
            // @allow \Pike\PikeException
            $out->addFile("{$this->sivujettiBackendPath}{$f}", $f);
    }
}
