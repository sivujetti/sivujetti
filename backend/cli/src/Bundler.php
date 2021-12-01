<?php declare(strict_types=1);

namespace Sivujetti\Cli;

use Pike\PikeException;
use Sivujetti\FileSystem;
use Sivujetti\Update\{PackageStreamInterface, Updater, ZipPackageStream};

/**
 * Creates a zip file / directory with following structure:
 * ```
 * /$backend      <-- literally directory named "$backend"
 *   /some-dir
 *     file2.php
 *   file1.php
 * /$index
 *   some-file.js
 * $backend-files-list.php // Contains "<?php // ["$backend/some-dir/file2.php","$backend/file1.php"]"
 * $index-files-list.php   // Contains "<?php // ["$index/some-file.js"]"
 * ```
 */
final class Bundler {
    /** @var \Sivujetti\FileSystem */
    private FileSystem $fs;
    /** @var \Closure fn(...$args) => string */
    private \Closure $doPrint;
    /** @var \Closure fn(string $command) => string|false|null */
    private \Closure $shellExecFn;
    /** @var string SIVUJETTI_BACKEND_PATH */
    private string $sivujettiBackendPath;
    /** @var string SIVUJETTI_PUBLIC_PATH */
    private string $sivujettiIndexPath;
    /** @var string SIVUJETTI_BACKEND_PATH . "bundler-temp" */
    private string $tempDirForComposerInstall;
    /** @var string SIVUJETTI_PUBLIC_PATH . "public/bundler-temp/public/sivujetti" */
    private string $tempDirForNpmBuild;
    /**
     * @param \Sivujetti\FileSystem $fs
     * @param ?callable $printFn = function ($msg) { echo $msg . PHP_EOL; }
     * @param ?callable $shellExecFn = function ($cmd) { return shell_exec($cmd); }
     */
    public function __construct(FileSystem $fs,
                                ?callable $printFn = null,
                                ?callable $shellExecFn = null) {
        $this->fs = $fs;
        $this->doPrint = $printFn ?? function ($msg) { echo $msg . PHP_EOL; };
        $this->shellExecFn = $shellExecFn instanceof \Closure ? $shellExecFn : \Closure::fromCallable("shell_exec");
        $this->sivujettiBackendPath = SIVUJETTI_BACKEND_PATH;
        $this->sivujettiIndexPath = SIVUJETTI_PUBLIC_PATH;
        $this->tempDirForComposerInstall = "{$this->sivujettiBackendPath}bundler-temp";
        $this->tempDirForNpmBuild = "{$this->sivujettiIndexPath}public/bundler-temp/public/sivujetti";
    }
    /**
     * @param \Sivujetti\Update\PackageStreamInterface $to Zip or local directory
     * @param string $fileOrDirPath Target path for PackageStreamInterface
     * @param bool $allowOverWrite = false
     */
    public function makeRelease(PackageStreamInterface $to,
                                string $fileOrDirPath,
                                bool $allowOverWrite = false): string {
        $this->destryPreviousTargetOrThrow($to, $fileOrDirPath, $allowOverWrite);
        $to->open($fileOrDirPath, true);
        //
        $this->createAndSetupTmpDirs();
        $this->installBackendVendorDeps($this->tempDirForComposerInstall);
        $this->bundleFrontend($this->tempDirForNpmBuild);
        $backendRelatedFileGroups = $this->makeBackendFilesFileListGroups();
        $publicRelatedFileGroups = $this->makePublicFilesFileListGroups();
        //
        $this->writeFiles($backendRelatedFileGroups, "backend", $to);
        $this->writeFiles($publicRelatedFileGroups, "index", $to);
        //
        $contents = $to->getResult();
        $this->deleteTmpDirs();
        return $contents;
    }
    /**
     * @see $this->makeRelease()
     */
    private function destryPreviousTargetOrThrow(PackageStreamInterface $to,
                                                 string $fileOrDirPath,
                                                 bool $allowOverWrite): void {
        if ($to instanceof ZipPackageStream) {
            if (!$this->fs->isFile($fileOrDirPath))
                return;
            if (!$allowOverWrite)
                throw new PikeException("Target `$fileOrDirPath` already exists.");
            else
                $this->fs->unlink($fileOrDirPath);
        } else {
            if (!$this->fs->isDir($fileOrDirPath))
                return;
            if (!$allowOverWrite)
                throw new PikeException("Target `$fileOrDirPath` already exists.");
            else
                throw new \Exception("Not implemented");
        }
    }
    /**
     * Creates two temporary directories we'll be using during the bunding
     * process.
     *
     * /backend
     *   /bundler-temp     <- this
     *     ..
     *     composer.json
     * /public
     *   /bundler-temp
     *     /public
     *       /sivujetti    <- this
     *     ...
     * index.php
     * ...
     */
    private function createAndSetupTmpDirs(): void {
        $tempDirPaths = [$this->tempDirForComposerInstall,
                         $this->tempDirForNpmBuild];
        foreach ($tempDirPaths as $path) {
            if (!$this->fs->isDir($path) && !$this->fs->mkDir($path))
                throw new PikeException("Failed to create temp directory `{$path}`",
                                        PikeException::FAILED_FS_OP);
        }
        if (!$this->fs->copy("{$this->sivujettiBackendPath}composer.json",
                             "{$this->tempDirForComposerInstall}/composer.json"))
            throw new PikeException("Failed to copy `composer.json` to temp directory",
                                    PikeException::FAILED_FS_OP);
    }
    /**
     * Writes optimized `backend/vendor/*` to $toDir using the `composer` command.
     *
     * @param string $toDir
     */
    private function installBackendVendorDeps(string $toDir): void {
        $originalCwd = getcwd();
        $this->doPrint->__invoke("cd <tempDirForComposerInstall>...");
        chdir($toDir);
        $this->doPrint->__invoke("Executing `composer install`...");
        $this->shellExecFn->__invoke("composer install --no-dev --optimize-autoloader");
        if (!$this->fs->isFile("{$toDir}/vendor/autoload.php"))
            throw new PikeException("Failed to `composer install`",
                                    PikeException::FAILED_FS_OP);
        $this->doPrint->__invoke("cd <currentWorkingDir>...");
        chdir($originalCwd);
        $this->doPrint->__invoke("Done.");
    }
    /**
     * Writes optimized `public/sivujetti/*.js` to $toDir using the `npm` command.
     *
     * @param string $toDir
     */
    private function bundleFrontend(string $toDir): void {
        $this->doPrint->__invoke("Executing `npm run-script build`...");
        // "/index/path/public/bundler-temp/public/sivujetti" -> "public/bundler-temp/public/sivujetti/"
        $relDir = str_replace($this->sivujettiIndexPath, "", $toDir) . "/";
        $this->shellExecFn->__invoke("npm --prefix {$this->sivujettiIndexPath} run-script build -- " .
                                     "--configBundle all --configTargetRelDir {$relDir}");
        if (!$this->fs->isFile("{$toDir}/sivujetti-edit-app.js"))
            throw new PikeException("Failed to `npm run-script build`",
                                    PikeException::FAILED_FS_OP);
        $this->doPrint->__invoke("Done.");
    }
    /**
     * Constructs a list of files that will be included to the output package,
     * tagged as a backend file.
     *
     * @return \Sivujetti\Cli\FileGroup[]
     */
    private function makeBackendFilesFileListGroups(): array {
        $base1 = $this->sivujettiBackendPath;
        $relatifyPath = Updater::makeRelatifier($base1);
        $prefix = PackageStreamInterface::FILE_NS_BACKEND;
        $prefixyAndRelatifyPath = fn($p) => "{$prefix}{$relatifyPath($p)}";
        // assets
        $out = [
            "{$prefix}assets/templates/_menu-print-branch.tmpl.php",
            "{$prefix}assets/templates/block-auto.tmpl.php",
            "{$prefix}assets/templates/block-generic-wrapper.tmpl.php",
            "{$prefix}assets/templates/block-menu.tmpl.php",
            "{$prefix}assets/templates/edit-app-wrapper.tmpl.php",
        ];
        // cli
        $cliPaths = $this->fs->readDirRecursive("{$base1}cli/src", "/^.*\.php$/");
        $out = array_merge($out, array_map($prefixyAndRelatifyPath, $cliPaths));
        // installer
        $flags = \FilesystemIterator::CURRENT_AS_PATHNAME | \FilesystemIterator::SKIP_DOTS;
        $instPaths = $this->fs->readDirRecursive("{$base1}installer",
                                                  "/^[^.]+" .      // starts with "<anyExceptDot>"
                                                  "[^\\/]+\..+$/", // followed by "<anyExceptSlash>.<any>"
                                                  $flags);
        $testsDir = "{$base1}installer/tests/";
        foreach ($instPaths as $path) {
            if (str_starts_with($path, $testsDir) ||
                str_ends_with($path, "config.in.php")) continue;
            $out[] = $prefixyAndRelatifyPath($path);
        }
        // sivujetti
        $sjetPaths = $this->fs->readDirRecursive("{$base1}sivujetti/src", "/^.*\.php$/");
        $out = array_merge($out, array_map($prefixyAndRelatifyPath, $sjetPaths));
        // vendor
        $base2 = "{$this->tempDirForComposerInstall}/";
        $vendorFilePaths = $this->fs->readDirRecursive("{$base2}vendor", "/.*/");
        $relatifyPath2 = Updater::makeRelatifier($base2); // "/temp/dir/vendor/bar.php" -> "vendor/bar.php"
        $out2 = [];
        foreach ($vendorFilePaths as $path) {
            if (str_contains($path, "/.")) continue;
            $out2[] = "{$prefix}{$relatifyPath2($path)}";
        }
        //
        return [new FileGroup($base1, $out, $prefix),
                new FileGroup($base2, $out2, $prefix)];
    }
    /**
     * Constructs a list of files that will be included to the output package,
     * tagged as a frontend file.
     *
     * @return \Sivujetti\Cli\FileGroup[]
     */
    private function makePublicFilesFileListGroups(): array {
        $base1 = $this->sivujettiIndexPath;
        $base2 = "{$this->sivujettiIndexPath}public/bundler-temp/";
        $relatifyPath = Updater::makeRelatifier($base1);
        $prefix = PackageStreamInterface::FILE_NS_INDEX;
        $prefixyAndRelatifyPath = fn($p) => "{$prefix}{$relatifyPath($p)}";
        // $indexPath/public/sivujetti/assets/*.*
        $assetFilePaths = $this->fs->readDir("{$base1}public/sivujetti/assets");
        $out = array_map($prefixyAndRelatifyPath, $assetFilePaths);
        // $indexPath/public/sivujetti/vendor/*.*
        $vendorFilePaths = $this->fs->readDir("{$base1}public/sivujetti/vendor");
        $out = array_merge($out, array_map($prefixyAndRelatifyPath, $vendorFilePaths));
        // $indexPath/public/sivujetti/*.css
        $out[] = "{$prefix}public/sivujetti/sivujetti-edit-app.css";
        // $indexPath/*.*
        $out = array_merge($out, ["{$prefix}index.php", "{$prefix}install.php", "{$prefix}LICENSE"]);
        // $indexPath/public/sivujetti/*.js
        $bundledFilePaths = $this->fs->readDir("$this->tempDirForNpmBuild");
        $relatify2 = Updater::makeRelatifier($base2); // ../public/bundler-temp/public/sivujetti/*.js
                                                      // -> $indexPath/public/sivujetti/*.js
        $out2 = array_map(fn($p) => "{$prefix}{$relatify2($p)}", $bundledFilePaths);
        //
        return [new FileGroup($base1, $out, $prefix),
                new FileGroup($base2, $out2, $prefix)];
    }
    /**
     * Writes $fileGroups.* and their file lists to $out.
     *
     * @param \Sivujetti\Cli\FileGroup[] $fileGroups
     * @param string $dirName "backend" or "index"
     * @param \Sivujetti\Update\PackageStreamInterface $out
     */
    private function writeFiles(array $fileGroups, string $dirName, PackageStreamInterface $out): void {
        $this->doPrint->__invoke("Writing {$dirName} files to output stream...");
        //
        $filesList = [];
        foreach ($fileGroups as $group) $filesList = array_merge($filesList, $group->nsdRelFilePaths);
        $out->addFileMap("\${$dirName}-files-list.php", $filesList);
        //
        foreach ($fileGroups as $group) {
            $from = $group->basePathToCopyFrom;
            $stripDirNs = Updater::makeRelatifier($group->dirNameSpace);
            foreach ($group->nsdRelFilePaths as $path) {
                // @allow \Pike\PikeException
                $out->addFile("{$from}{$stripDirNs($path)}", $path);
            }
        }
        $this->doPrint->__invoke("Done.");
    }
    /**
     */
    private function deleteTmpDirs(): void {
        $toWipe = $this->tempDirForComposerInstall;
        $eachEntryMustStartWith = $this->sivujettiBackendPath;
        if (($err = $this->fs->deleteFilesRecursive($toWipe,
                                                    $eachEntryMustStartWith)))
            throw new PikeException("Failed to delete temp directory: {$err}",
                                    PikeException::FAILED_FS_OP);
        // "public/bundler-temp/public/sivujetti" -> "public/bundler-temp"
        $toWipe2 = dirname($this->tempDirForNpmBuild, 2);
        $eachEntryMustStartWith2 = "{$this->sivujettiIndexPath}public/";
        if (($err2 = $this->fs->deleteFilesRecursive($toWipe2,
                                                     $eachEntryMustStartWith2)))
            throw new PikeException("Failed to delete temp directory: {$err2}",
                                    PikeException::FAILED_FS_OP);
    }
}

final class FileGroup {
    public function __construct(
        public string $basePathToCopyFrom,
        public array $nsdRelFilePaths, // e.g. ["$backend/assets/templates/block-auto.tmpl.php", ...]
        public string $dirNameSpace    // e.g. "$backend/"
    ) {
        //
    }
}
