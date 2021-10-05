<?php declare(strict_types=1);

namespace Sivujetti\Upload;

use Pike\{FileSystem, PikeException};
use Sivujetti\Upload\Entities\UploadsEntry;
use Sivujetti\ValidationUtils;

final class Uploader {
    public const DEFAULT_MAX_SIZE_B = 1024 * 1024 * 8;
    /** @var \Closure */
    private \Closure $moveUploadedFileFn;
    /**
     * @param ?callable $moveUploadedFileFn = "move_uploaded_file"
     */
    public function __construct(?callable $moveUploadedFileFn = null) {
        $this->moveUploadedFileFn = $moveUploadedFileFn instanceof \Closure
            ? $moveUploadedFileFn
            : \Closure::fromCallable("move_uploaded_file");
    }
    /**
     * @param array<string, mixed> $file ["size" => int, "tmp_name" => string, "name" => string]
     * @param string $toDir An absolute path to the target directory, must exist
     * @param ?string $targetFileName
     * @param int $maxSize Bytes
     * @return \Sivujetti\Upload\Entities\UploadsEntry
     * @throws \Pike\PikeException
     */
    public function upload(array $file,
                           string $toDir,
                           ?string $targetFileName = null,
                           int $maxSize = self::DEFAULT_MAX_SIZE_B): UploadsEntry {
        if (($file["size"] ?? -1) < 0 ||
            !strlen($file["tmp_name"] ?? "") ||
            preg_match("/\/|\.\./", $file["name"] ?? "/")) // anything except "/" or ".."
            throw new PikeException("Invalid file", PikeException::BAD_INPUT);
        //
        if ($file["size"] > $maxSize)
            throw new PikeException("Uploaded file larger than allowed {$maxSize}B",
                                    PikeException::BAD_INPUT);
        if ($targetFileName)
            ValidationUtils::checkIfValidaPathOrThrow($targetFileName, true);
        // @allow \Pike\PikeException
        $mime = $this->getMime($file["tmp_name"], "?");
        if (!self::isImage($mime))
            throw new PikeException("`{$mime}` is not valid mime",
                                    PikeException::BAD_INPUT);
        //
        $out = new UploadsEntry;
        $relFilePath = ltrim($targetFileName ?: $file["name"], "/");
        $out->baseDir = dirname($relFilePath) . "/";
        if ($out->baseDir === "./") $out->baseDir = "";
        $out->fileName = substr($relFilePath, strlen($out->baseDir));
        $basePath = FileSystem::normalizePath($toDir) . "/";
        if ($this->moveUploadedFileFn->__invoke(
            $file["tmp_name"],
            "{$basePath}{$out->baseDir}{$out->fileName}"
        )) {
            $out->mime = $mime;
            return $out;
        }
        throw new PikeException("Failed to move_uploaded_file()",
                                PikeException::FAILED_FS_OP);
    }
    /**
     * @param string $filePath
     * @param string $fallback = "?"
     * @return string
     * @throws \Pike\PikeException
     */
    private function getMime(string $filePath,
                             string $fallback = "?"): string {
        static $finfo;
        if (!$finfo && ($finfo = finfo_open(FILEINFO_MIME_TYPE)) === false)
            throw new PikeException("finfo_open() failed", PikeException::FAILED_FS_OP);
        return finfo_file($finfo, $filePath) ?? $fallback;
    }
    /**
     * @param string $mime "image/jpg" etc.
     * @return bool
     */
    public static function isImage(string $mime): bool {
        return str_starts_with($mime, "image/");
    }
}
