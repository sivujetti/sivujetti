<?php declare(strict_types=1);

namespace Sivujetti\Installer;

use Pike\{FileSystem, PikeException};
use Pike\Interfaces\FileSystemInterface;
use Sivujetti\ValidationUtils;
use Sivujetti\Update\{PackageStreamInterface, Updater};

final class LocalDirPackage implements PackageStreamInterface {
    /** @var \Pike\Interfaces\FileSystemInterface */
    private FileSystemInterface $fs;
    /** @var string An absolute path to the directory we're writing to */
    private string $writeToAbsDirPath;
    /** @var string An absolute path to the directory we're reading */
    private string $readFromAbsDirPath;
    /**
     * @param \Pike\Interfaces\FileSystemInterface $fs
     */
    public function __construct(FileSystemInterface $fs) {
        $this->fs = $fs;
        $this->writeToAbsDirPath = "";
        $this->readFromAbsDirPath = "";
    }
    /**
     * @inheritdoc
     */
    public function open(string $fullDirPath, bool $create = false): string {
        ValidationUtils::checkIfValidaPathOrThrow($fullDirPath);
        if ($create) {
            $this->writeToAbsDirPath = FileSystem::normalizePath($fullDirPath);
            if (!str_starts_with($this->writeToAbsDirPath, SIVUJETTI_BACKEND_PATH))
                throw new PikeException("Directory `{$this->writeToAbsDirPath}` must start with `" .
                                        SIVUJETTI_BACKEND_PATH . "`.",
                                        PikeException::BAD_INPUT);
            return $this->writeToAbsDirPath;
        }
        $this->readFromAbsDirPath = FileSystem::normalizePath($fullDirPath);
        $ALLOWED_BASES = [SIVUJETTI_BACKEND_PATH . "installer/sample-content"];
        if (!in_array(dirname($this->readFromAbsDirPath), $ALLOWED_BASES, true))
            throw new PikeException("Directory `{$this->readFromAbsDirPath}` must start with `" .
                                    implode("`|`", $ALLOWED_BASES) . "`.",
                                    PikeException::BAD_INPUT);
        if (!$this->fs->isDir($this->readFromAbsDirPath))
            throw new PikeException("Directory `{$this->readFromAbsDirPath}` doesn't exist or isn't readable",
                                    PikeException::BAD_INPUT);
        return $this->readFromAbsDirPath;
    }
    /**
     * @inheritdoc
     */
    public function addFile(string $filePath,
                            string $localName = null,
                            int $start = 0,
                            int $length = 0): bool {
        $toFilePath = $this->getTargetWritePath($localName);
        $parentDir = dirname($toFilePath);
        if ($parentDir !== "." && $parentDir !== "/")
            $this->createTargetDirIfNotExist($parentDir);
        //
        $fromFilePath = $filePath;
        if (!$this->fs->copy($fromFilePath, $toFilePath))
            throw new PikeException("Failed to copy `{$fromFilePath}` -> `{$toFilePath}`",
                                    PikeException::FAILED_FS_OP);
        return true;
    }
    /**
     * @inheritdoc
     */
    public function addFileMap(string $localName, array $localNames): bool {
        // Do nothing
        return true;
    }
    /**
     * @inheritdoc
     */
    public function addFromString(string $localName, string $contents): bool {
        $toFilePath = $this->getTargetWritePath($localName);
        if (!$this->fs->write($toFilePath, $contents))
            throw new PikeException("Failed to write `{$toFilePath}`",
                                    PikeException::FAILED_FS_OP);
        return true;
    }
    /**
     * @inheritdoc
     */
    public function read(string $localName): string {
        ValidationUtils::checkIfValidaPathOrThrow($localName);
        return $this->fs->read("$this->readFromAbsDirPath/{$localName}");
    }
    /**
     * @inheritdoc
     */
    public function extractMany(string $destinationPath,
                                $localNames = [],
                                ?string $prefixToStripFromLocalNames = null): bool {
        ValidationUtils::checkIfValidaPathOrThrow($destinationPath);
        $stripPrefix = $prefixToStripFromLocalNames
            ? Updater::makeRelatifier($prefixToStripFromLocalNames)
            : null;
        foreach ($localNames as $relativePath) {
            ValidationUtils::checkIfValidaPathOrThrow($relativePath);
            $fromAbsPath = "{$this->readFromAbsDirPath}/{$relativePath}";
            $toAbsPath = $destinationPath . ($stripPrefix ? $stripPrefix($relativePath) : $relativePath);
            //
            $this->createTargetDirIfNotExist(dirname($toAbsPath));
            $this->fs->copy($fromAbsPath, $toAbsPath);
        }
        return true;
    }
    /**
     * @inheritdoc
     */
    public function getResult(int $flags = 0): string {
        return $this->writeToAbsDirPath;
    }
    /**
     * @param string $path
     * @throws \Pike\PikeException
     */
    private function createTargetDirIfNotExist(string $path): void {
        if (!$this->fs->isDir($path) && !$this->fs->mkDir($path))
            throw new PikeException("Failed to create directory `{$path}`.",
                                    PikeException::FAILED_FS_OP);
    }
    /**
     * @param string $localName
     * @throws \Pike\PikeException
     */
    private function getTargetWritePath($localName): string {
        if (!$this->writeToAbsDirPath)
            throw new PikeException("Create mode expected (\$package->open(..., true)).",
                                    PikeException::BAD_INPUT);
        ValidationUtils::checkIfValidaPathOrThrow($localName);
        return "{$this->writeToAbsDirPath}/{$localName}";
    }
}
