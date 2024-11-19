<?php declare(strict_types=1);

namespace Sivujetti\Cli;

use Pike\PikeException;
use Sivujetti\{FileSystem, JsonUtils, ValidationUtils};
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
    private string $backendDirPath;
    /** @var string SIVUJETTI_INDEX_PATH */
    private string $indexDirPath;
    /** @var ?string Example "/Applications/MAMP/htdocs/sivujetti/backend/sivujetti-0.14.0-dev-tmp/final/backend/" */
    private ?string $sourceBackendDirPath;
    /** @var ?string Example "/Applications/MAMP/htdocs/sivujetti/backend/sivujetti-0.14.0-dev-tmp/final/ */
    private ?string $sourceIndexDirPath;
    /** @var string SIVUJETTI_BACKEND_PATH . "bundler-temp" */
    private string $tempDirForComposerInstall;
    /** @var string SIVUJETTI_INDEX_PATH . "public/bundler-temp/public/sivujetti" */
    private string $tempDirForNpmBuild;
    /**
     * @param \Sivujetti\FileSystem $fs
     * @param ?string $sourcePath = null Example: "/Applications/MAMP/htdocs/sivujetti/backend/sivujetti-0.14.0-dev-tmp/final/"
     * @param ?callable $printFn = function ($msg) { echo $msg . PHP_EOL; }
     * @param ?callable $shellExecFn = function ($cmd) { return shell_exec($cmd); }
     */
    public function __construct(FileSystem $fs,
                                ?string $sourcePath = null,
                                ?callable $printFn = null,
                                ?callable $shellExecFn = null) {
        $this->fs = $fs;
        $this->doPrint = $printFn ?? function ($msg) { echo $msg . PHP_EOL; };
        $this->shellExecFn = $shellExecFn instanceof \Closure ? $shellExecFn : \Closure::fromCallable("shell_exec");
        $this->backendDirPath = SIVUJETTI_BACKEND_PATH;
        $this->indexDirPath = SIVUJETTI_INDEX_PATH;
        if (!$sourcePath) {
            $this->sourceBackendDirPath = null;
            $this->sourceIndexDirPath = null;
        } else {
            $this->setSourceDir($sourcePath);
        }
        $this->tempDirForComposerInstall = "{$this->backendDirPath}bundler-temp";
        $this->tempDirForNpmBuild = "{$this->indexDirPath}public/bundler-temp/public/sivujetti";
    }
    /**
     * @param \Sivujetti\Update\PackageStreamInterface $to Zip or local directory
     * @param string $fileOrDirPath Target path for PackageStreamInterface
     * @param bool $allowOverWrite = false
     * @param int $resultFlags = ZipPackageStream::FLAG_AS_STRING
     */
    public function makeRelease(PackageStreamInterface $to,
                                string $fileOrDirPath,
                                bool $allowOverWrite = false,
                                int $resultFlags = ZipPackageStream::FLAG_AS_STRING): string {
        if ($this->sourceBackendDirPath || $this->sourceIndexDirPath)
            throw new \RuntimeException("Not supported yet.");
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
        $contents = $to->getResult($resultFlags);
        $this->deleteTmpDirs();
        return $contents;
    }
    /**
     * @param \Sivujetti\Update\PackageStreamInterface $to Zip or local directory
     * @param string $fileOrDirPath Target path
     * @param string $relPatchContentsMapFile Path to a json file that lists what to include to $to
     * @param bool $allowOverWrite = false
     * @param int $resultFlags = ZipPackageStream::FLAG_AS_STRING
     */
    public function makePatch(PackageStreamInterface $to,
                                string $fileOrDirPath,
                                string $relPatchContentsMapFile,
                                bool $allowOverWrite = false,
                                int $resultFlags = ZipPackageStream::FLAG_AS_STRING): string {
        ValidationUtils::checkIfValidaPathOrThrow($relPatchContentsMapFile);
        $json = $this->fs->read("{$this->backendDirPath}{$relPatchContentsMapFile}");
        $map = JsonUtils::parse($json);
        self::validatePatchFileLists($map);
        $this->destryPreviousTargetOrThrow($to, $fileOrDirPath, $allowOverWrite);
        $to->open($fileOrDirPath, true);
        //
        $backendRelatedFileGroups = [new FileGroup(
            $this->sourceBackendDirPath ?? $this->backendDirPath,
            $map->backendFiles ?? [],
            PackageStreamInterface::FILE_NS_BACKEND)
        ];
        $publicRelatedFileGroups = [new FileGroup(
            $this->sourceIndexDirPath ?? $this->indexDirPath,
            $map->indexFiles ?? [],
            PackageStreamInterface::FILE_NS_INDEX)
        ];
        //
        $this->writeFiles($backendRelatedFileGroups, "backend", $to);
        $this->writeFiles($publicRelatedFileGroups, "index", $to);
        //
        $contents = $to->getResult($resultFlags);
        return $contents;
    }
    /**
     * @param ?string $sourcePath = null
     */
    public function setSourceDir(string $relDirPath): void {
        $this->sourceBackendDirPath = "{$relDirPath}backend/";// "{$this->backendDirPath}{$relDirPath}backend/";
        $this->sourceIndexDirPath = "{$relDirPath}";// "{$this->backendDirPath}{$relDirPath}";
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
        if (!$this->fs->copy("{$this->backendDirPath}composer.json",
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
        // "/server/root/path/public/bundler-temp/public/sivujetti" -> "public/bundler-temp/public/sivujetti/"
        $relDir = str_replace($this->indexDirPath, "", $toDir) . "/";
        $this->shellExecFn->__invoke("npm --prefix {$this->indexDirPath} run-script build -- " .
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
        $base1 = $this->backendDirPath;
        $relatifyPath = Updater::makeRelatifier($base1);
        $prefix = PackageStreamInterface::FILE_NS_BACKEND;
        $prefixyAndRelatifyPath = fn($p) => "{$prefix}{$relatifyPath($p)}";
        // assets
        $out = [
            "{$prefix}assets/templates/_menu-print-branch.tmpl.php",
            "{$prefix}assets/templates/block-auto.tmpl.php",
            "{$prefix}assets/templates/block-generic-wrapper.tmpl.php",
            "{$prefix}assets/templates/block-listing-pages-default.tmpl.php",
            "{$prefix}assets/templates/block-menu.tmpl.php",
            "{$prefix}assets/templates/edit-app-wrapper.tmpl.php",
            "{$prefix}assets/templates/page-auth-view.tmpl.php",
        ];
        // cli
        $cliPaths = $this->fs->readDirRecursive("{$base1}cli/src", "/^.*\.php$/");
        $out = [...$out, ...array_map($prefixyAndRelatifyPath, $cliPaths)];
        // installer
        $flags = \FilesystemIterator::CURRENT_AS_PATHNAME | \FilesystemIterator::SKIP_DOTS;
        $instPaths = $this->fs->readDirRecursive("{$base1}installer",
                                                  "/^[^.]+" .      // starts with "<anyExceptDot>"
                                                  "[^\\/]+\..+$/", // followed by "<anyExceptSlash>.<any>"
                                                  $flags);
        $testsDir = "{$base1}installer/tests/";
        foreach ($instPaths as $path) {
            if (str_starts_with($path, $testsDir)) continue;
            $out[] = $prefixyAndRelatifyPath($path);
        }
        // sivujetti
        $sjetPaths = $this->fs->readDirRecursive("{$base1}sivujetti/src", "/^.*\.php$/");
        $out = [...$out, ...array_map($prefixyAndRelatifyPath, $sjetPaths)];
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
        $base1 = $this->indexDirPath;
        $base2 = "{$this->indexDirPath}public/bundler-temp/";
        $relatifyPath = Updater::makeRelatifier($base1);
        $prefix = PackageStreamInterface::FILE_NS_INDEX;
        $prefixyAndRelatifyPath = fn($p) => "{$prefix}{$relatifyPath($p)}";
        // $indexPath/public/sivujetti/assets|content-template-previews/*.*
        $assetFilePaths = [...$this->fs->readDir("{$base1}public/sivujetti/assets"),
                           ...$this->fs->readDir("{$base1}public/sivujetti/content-template-previews")];
        $out = array_map($prefixyAndRelatifyPath, $assetFilePaths);
        // $indexPath/public/sivujetti/vendor/*.*
        $vendorFilePaths = $this->fs->readDir("{$base1}public/sivujetti/vendor");
        $out = [...$out, ...array_map($prefixyAndRelatifyPath, $vendorFilePaths)];
        // $indexPath/public/sivujetti/*.css
        $out[] = "{$prefix}public/sivujetti/sivujetti-edit-app.css";
        // $indexPath/*.*
        $out = [...$out, "{$prefix}index.php", "{$prefix}install.php", "{$prefix}LICENSE"];
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
        foreach ($fileGroups as $group) $filesList = [...$filesList, ...$group->nsdRelFilePaths];
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
        $eachEntryMustStartWith = $this->backendDirPath;
        if (($err = $this->fs->deleteFilesRecursive($toWipe,
                                                    $eachEntryMustStartWith)))
            throw new PikeException("Failed to delete temp directory: {$err}",
                                    PikeException::FAILED_FS_OP);
        // "public/bundler-temp/public/sivujetti" -> "public/bundler-temp"
        $toWipe2 = dirname($this->tempDirForNpmBuild, 2);
        $eachEntryMustStartWith2 = "{$this->indexDirPath}public/";
        if (($err2 = $this->fs->deleteFilesRecursive($toWipe2,
                                                     $eachEntryMustStartWith2)))
            throw new PikeException("Failed to delete temp directory: {$err2}",
                                    PikeException::FAILED_FS_OP);
    }
    /**
     * @param object{backendFiles: string[], indexFiles: string[]} $map
     * @throws \Pike\PikeException
     */
    private static function validatePatchFileLists(object $map): void {
        foreach ([
            ["backendFiles", "\$backend/"],
            ["indexFiles", "\$index/"]
        ] as [$key, $mustStartWith]) {
            $candidate = $map->{$key} ?? null;
            if (!is_array($candidate))
                throw new PikeException("{$key} must be an array");
            foreach ($candidate as $nsdRelFilePath) {
                ValidationUtils::checkIfValidaPathOrThrow($nsdRelFilePath);
                if (!str_starts_with($nsdRelFilePath, $mustStartWith))
                    throw new PikeException("Each entry in \$map->{$key} must start with `{$mustStartWith}`");
            }
        }
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
