<?php declare(strict_types=1);

namespace Sivujetti\Update;

use Pike\PikeException;
use Pike\Interfaces\FileSystemInterface;
use Sivujetti\ValidationUtils;
use ZipArchive;

class ZipPackageStream implements PackageStreamInterface {
    public const CREATE_TEMP_FILE_PATH = "@createTemp";
    public const FLAG_AUTOCLEAN = 1 << 1;
    public const FLAG_AS_STRING = 1 << 2;
    public const FLAG_AS_PATH = 1 << 3;
    /** @var \ZipArchive */
    private ZipArchive $zip;
    /** @var \Pike\Interfaces\FileSystemInterface */
    private FileSystemInterface $fs;
    /** @var string */
    private string $tmpFilePath;
    /** @var ?string */
    private ?string $targetFilePath;
    /**
     * @param \Pike\Interfaces\FileSystemInterface $fs
     */
    public function __construct(FileSystemInterface $fs) {
        $this->fs = $fs;
    }
    /**
     * @param string $filePath
     * @param bool $create = false
     * @return string $tmpFilePath
     * @throws \Pike\PikeException
     */
    public function open(string $filePath, bool $create = false): string {
        $this->zip = new ZipArchive();
        $this->targetFilePath = null;
        $flags = ZipArchive::CHECKCONS;
        if ($create) {
            if ($filePath && $filePath !== self::CREATE_TEMP_FILE_PATH) {
                ValidationUtils::checkIfValidaPathOrThrow($filePath);
                $this->targetFilePath = $filePath;
            }
            if (!($filePath = tempnam(sys_get_temp_dir(), "zip")))
                throw new PikeException("Failed to generate temp file name",
                                        PikeException::FAILED_FS_OP);
            $flags = ZipArchive::OVERWRITE;
        }
        if (($res = $this->zip->open($filePath, $flags)) === true) {
            $this->tmpFilePath = $filePath;
        } else {
            throw new PikeException(sprintf(
                "Failed to %s zip: `%s`",
                !$create ? "open" : "create",
                match ($res) {
                    ZipArchive::ER_EXISTS => "ZipArchive::ER_EXISTS: File already exists.",
                    ZipArchive::ER_INCONS => "ZipArchive::ER_INCONS: Zip archive inconsistent.",
                    ZipArchive::ER_INVAL => "ZipArchive::ER_INVAL: Invalid argument.",
                    ZipArchive::ER_MEMORY => "ZipArchive::ER_MEMORY: Malloc failure.",
                    ZipArchive::ER_NOENT => "ZipArchive::ER_NOENT: No such file.",
                    ZipArchive::ER_NOZIP => "ZipArchive::ER_NOZIP: Not a zip archive.",
                    ZipArchive::ER_OPEN => "ZipArchive::ER_OPEN: Can't open file.",
                    ZipArchive::ER_READ => "ZipArchive::ER_READ: Read error.",
                    ZipArchive::ER_SEEK => "ZipArchive::ER_SEEK: Seek error.",
                    default => "Unknown error (code {$res})",
                }
            ), PikeException::FAILED_FS_OP);
        }
        return $filePath;
    }
    /**
     * @param string $filePath
     * @param ?string $localName = null
     * @param int $start = 0
     * @param int $length = 0
     * @return bool
     * @throws \Pike\PikeException
     */
    public function addFile(string $filePath,
                            ?string $localName = null,
                            int $start = 0,
                            int $length = 0): bool {
        if ($this->zip->addFile($filePath, $localName, $start, $length))
            return true;
        throw new PikeException("Failed to read `{$filePath}` to zip stream",
                                PikeException::FAILED_FS_OP);
    }
    /**
     * @inheritdoc
     */
    public function addFileMap(string $localName, array $localNames): bool {
        return $this->addFromString($localName,
            "<?php // " . json_encode($localNames, JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR));
    }
    /**
     * @param string $localName
     * @param string $contents
     * @return bool
     * @throws \Pike\PikeException
     */
    public function addFromString(string $localName, string $contents): bool {
        if ($this->zip->addFromString($localName, $contents))
            return true;
        throw new PikeException("Failed to add `{$localName}` to zip stream",
                                PikeException::FAILED_FS_OP);
    }
    /**
     * @param string $localName
     * @return string
     * @throws \Pike\PikeException
     */
    public function read(string $localName): string {
        if (($str = $this->zip->getFromName($localName)) !== false)
            return $str;
        throw new PikeException("Failed to read `{$localName}` from zip stream",
                                PikeException::FAILED_FS_OP);
    }
    /**
     * @inheritdoc
     */
    public function extractMany(string $destinationPath,
                                $localNames = [],
                                ?string $prefixToStripFromLocalNames = null): bool {
        ValidationUtils::checkIfValidaPathOrThrow($destinationPath);
        if (!$prefixToStripFromLocalNames) {
            $this->zip->extractTo($destinationPath, $localNames);
            return true;
        }
        $stripPrefix = Updater::makeRelatifier($prefixToStripFromLocalNames);
        foreach (is_array($localNames) ? $localNames : [$localNames] as $prefixedLocalName) {
            ValidationUtils::checkIfValidaPathOrThrow($prefixedLocalName);
            $targetPath = "{$destinationPath}{$stripPrefix($prefixedLocalName)}";
            $parentDir = dirname($targetPath);
            if (!$this->fs->isDir($parentDir))
                $this->fs->mkDir($parentDir);
            $this->fs->copy("zip://{$this->tmpFilePath}#{$prefixedLocalName}",
                            $targetPath);
        }
        return true;
    }
    /**
     * @return string
     * @return string 
     * @throws \Pike\PikeException
     */
    public function getResult(int $flags = 0): string {
        if (!$this->zip->close())
            throw new PikeException("Failed to close zip stream",
                                    PikeException::FAILED_FS_OP);
        $resultFilePath = null;

        if ($this->targetFilePath) {
            if (!$this->fs->move($this->tmpFilePath, $this->targetFilePath))
                throw new PikeException("Failed to move zip stream output file",
                                        PikeException::FAILED_FS_OP);
            $resultFilePath = $this->targetFilePath;
        } else {
            $resultFilePath = $this->tmpFilePath;
        }

        $out = !($flags & self::FLAG_AS_STRING) ? $resultFilePath : $this->fs->read($resultFilePath);

        if (($flags & self::FLAG_AUTOCLEAN) && !$this->fs->unlink($resultFilePath))
            throw new PikeException("Failed to remove temp file",
                                    PikeException::FAILED_FS_OP);

        return $out;

    }
}
