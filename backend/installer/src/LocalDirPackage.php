<?php declare(strict_types=1);

namespace Sivujetti\Installer;

use Sivujetti\ValidationUtils;
use Pike\Interfaces\FileSystemInterface;
use Pike\PikeException;

final class LocalDirPackage implements PackageStreamInterface {
    /** @var \Pike\Interfaces\FileSystemInterface */
    private FileSystemInterface $fs;
    /** @var string An absolute path to the directory we're reading */
    private string $absDirPath;
    /**
     * @param \Pike\Interfaces\FileSystemInterface $fs
     */
    public function __construct(FileSystemInterface $fs) {
        $this->fs = $fs;
        $this->absDirPath = '';
    }
    /**
     * @inheritdoc
     */
    public function open(string $relDirPath, bool $create = false): string {
        $this->absDirPath = SIVUJETTI_BACKEND_PATH . "installer/sample-content/{$relDirPath}/";
        if (!$this->fs->isDir($this->absDirPath))
            throw new PikeException("Directory `{$this->absDirPath}` doesn't exist or isn't readable",
                                    PikeException::BAD_INPUT);
        return $this->absDirPath;
    }
    /**
     * @inheritdoc
     */
    public function addFile(string $filePath,
                            string $localName = null,
                            int $start = 0,
                            int $length = 0): bool {
        throw new \RuntimeException('Not supported');
    }
    /**
     * @inheritdoc
     */
    public function addFromString(string $localName, string $contents): bool {
        throw new \RuntimeException('Not supported');
    }
    /**
     * @inheritdoc
     */
    public function read(string $localName): string {
        ValidationUtils::checkIfValidaPathOrThrow($localName);
        return $this->fs->read("$this->absDirPath/{$localName}");
    }
    /**
     * @inheritdoc
     */
    public function extractMany(string $destinationPath,
                                $localNames = []): bool {
        ValidationUtils::checkIfValidaPathOrThrow($destinationPath);
        foreach ($localNames as $relativePath) {
            ValidationUtils::checkIfValidaPathOrThrow($relativePath);
            //
            $fromAbsPath = "{$this->absDirPath}{$relativePath}";
            $toAbsPath = "{$destinationPath}{$relativePath}";
            //
            $this->createTargetDirIfNotExist(dirname($toAbsPath));
            if (!$this->fs->copy($fromAbsPath, $toAbsPath))
                throw new PikeException("Failed to copy `{$fromAbsPath}` -> `{$toAbsPath}`",
                                        PikeException::FAILED_FS_OP);
        }
        return true;
    }
    /**
     * @param string $path
     * @throws \Pike\PikeException
     */
    private function createTargetDirIfNotExist(string $path): void {
        if (!$this->fs->isDir($path) && !$this->fs->mkDir($path))
            throw new PikeException("Failed to create `{$path}`",
                                    PikeException::FAILED_FS_OP);
    }
    /**
     * @inheritdoc
     */
    public function getResult(): string {
        throw new \RuntimeException('Not supported');
    }
    /**
     * @inheritdoc
     */
    public function writeToDisk(): void {
        throw new \RuntimeException('Not supported');
    }
}
