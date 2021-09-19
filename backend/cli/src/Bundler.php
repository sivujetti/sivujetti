<?php declare(strict_types=1);

namespace Sivujetti\Cli;

use Pike\{FileSystem, PikeException};
use Sivujetti\Update\{PackageStreamInterface, ZipPackageStream};

/**
 * Creates a zip file / directory with following structure:
 * ```
 * /$backend      <-- literally directory named "$backend"
 *   /some-dir
 *     file2.php
 *  file1.php
 * /$index
 *   some-file.js
 * $backend-files-list.php // Contains "<?php // ["$backend/some-dir/file2.php","$backend/file1.php"]"
 * $index-files-list.php   // Contains "<?php // ["$index/some-file.js"]"
 * ```
 */
final class Bundler {
    private FileSystem $fs;
    /** @var \Closure fn(...$args) => string */
    private \Closure $doPrint;
    /** @var string SIVUJETTI_BACKEND_PATH */
    private string $sivujettiBackendPath;
    /** @var string SIVUJETTI_PUBLIC_PATH */
    private string $sivujettiIndexPath;
    /**
     * @param \Pike\FileSystem $fs
     * @param ?\Closure $printFn = function ($msg) { echo $msg . PHP_EOL; }
     */
    public function __construct(FileSystem $fs,
                                ?\Closure $printFn = null) {
        $this->fs = $fs;
        $this->doPrint = $printFn ?? function ($msg) { echo $msg . PHP_EOL; };
        $this->sivujettiBackendPath = SIVUJETTI_BACKEND_PATH;
        $this->sivujettiIndexPath = SIVUJETTI_PUBLIC_PATH;
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
        $backendRelatedFileGroups = $this->makeBackendFilesFileListGroups();
        $this->writeFiles($backendRelatedFileGroups, "backend", $to);
        $contents = $to->getResult();
        return $contents;
    }
    /**
     * Returns a function that removes $basePath from the beginning of a string.
     *
     * @param string $basePath
     * @return \Closure
     */
    public static function makeRelatifier(string $basePath): \Closure {
        $after = strlen($basePath);
        return static fn($fullPath) => substr($fullPath, $after);
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
     * Constructs a list of files that will be included to the output package,
     * tagged as a backend file.
     *
     * @return \Sivujetti\Cli\FileGroup[]
     */
    private function makeBackendFilesFileListGroups(): array {
        $b = $this->sivujettiBackendPath;
        $relatifyPath = self::makeRelatifier($b);
        $prefix = PackageStreamInterface::FILE_NS_BACKEND;
        $prefixyAndRelatifyPath = fn($p) => "{$prefix}{$relatifyPath($p)}";
        // assets
        $out = [
            "{$prefix}assets/templates/_menu-print-branch.tmpl.php",
            "{$prefix}assets/templates/block-auto.tmpl.php",
            "{$prefix}assets/templates/block-generic-wrapper.tmpl.php",
            "{$prefix}assets/templates/block-listing.tmpl.php",
            "{$prefix}assets/templates/block-menu.tmpl.php",
            "{$prefix}assets/templates/edit-app-wrapper.tmpl.php",
        ];
        // cli
        $cliPaths = $this->fs->readDirRecursive("{$b}cli/src", "/^.*\.php$/");
        $out = array_merge($out, array_map($prefixyAndRelatifyPath, $cliPaths));
        // installer
        $flags = \FilesystemIterator::CURRENT_AS_PATHNAME | \FilesystemIterator::SKIP_DOTS;
        $instPaths = $this->fs->readDirRecursive("{$b}installer",
                                                  "/^[^.]+" .      // starts with "<anyExceptDot>"
                                                  "[^\\/]+\..+$/", // followed by "<anyExceptSlash>.<any>"
                                                  $flags);
        $testsDir = "{$b}installer/tests/";
        foreach ($instPaths as $path) {
            if (str_starts_with($path, $testsDir) ||
                str_ends_with($path, "config.in.php")) continue;
            $relPath = $prefixyAndRelatifyPath($path);
            $out[] = $relPath;
        }
        // sivujetti
        $sjetPaths = $this->fs->readDirRecursive("{$b}sivujetti/src", "/^.*\.php$/");
        $out = array_merge($out, array_map($prefixyAndRelatifyPath, $sjetPaths));
        // vendor
        // todo
        //
        return [new FileGroup($this->sivujettiBackendPath, $out, $prefix)];
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
            $stripDirNs = self::makeRelatifier($group->dirNameSpace);
            foreach ($group->nsdRelFilePaths as $path) {
                // @allow \Pike\PikeException
                $out->addFile("{$from}{$stripDirNs($path)}", $path);
            }
        }
        $this->doPrint->__invoke("Done.");
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
