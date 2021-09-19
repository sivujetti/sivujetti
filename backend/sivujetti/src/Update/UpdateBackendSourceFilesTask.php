<?php declare(strict_types=1);

namespace Sivujetti\Update;

use Pike\FileSystem;

final class UpdateBackendSourceFilesTask implements UpdateProcessTaskInterface {
    /** @var \Sivujetti\Update\ZipPackageStream */
    private ZipPackageStream $zip;
    /** @var \Pike\FileSystem */
    private FileSystem $fs;
    /** @var string */
    private string $targetPathBase;
    /** @var string[] */
    private array $filesToOverwriteNsd;
    /** @var string[] */
    private array $fileContentsBefore;
    /**
     * @var \Sivujetti\Update\ZipPackageStream $zip
     * @var \Pike\FileSystem $fs
     * @var string[] $nsdRelFilePaths e.g ["$backend/assets/templates/block-auto.tmpl.php", "$backend/sivujetti/src/App.php"]
     * @var string $targetDirPath e.g. "/var/www/sivujetti-backend/"
     */
    function __construct(ZipPackageStream $zip,
                         FileSystem $fs,
                         array $nsdRelFilePaths,
                         string $targetDirPath) {
        $this->zip = $zip;
        $this->fs = $fs;
        $this->targetPathBase = $targetDirPath;
        $this->filesToOverwriteNsd = $nsdRelFilePaths;
        $this->fileContentsBefore = [];
    }
    /**
     * Overwrites $this->filesToOverwriteNsd to $this->targetPathBase.
     */
    function exec(): void {
        $this->fileContentsBefore = []; // todo $this->fs->readMany($this->filesToOverwriteNsd);
        $this->zip->extractMany($this->targetPathBase, $this->filesToOverwriteNsd,
            PackageStreamInterface::FILE_NS_BACKEND);
    }
    /**
     * Reverts $this->exec().
     */
    function rollBack(): void {
        if ($this->fileContentsBefore) ; // todo foreach ($this->origFilesas $f) $fs->write($f->relFilePath, $f->contents);
    }
}
