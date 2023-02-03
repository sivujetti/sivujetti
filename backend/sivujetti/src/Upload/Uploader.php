<?php declare(strict_types=1);

namespace Sivujetti\Upload;

use Pike\{FileSystem, PikeException};
use Sivujetti\Upload\Entities\UploadsEntry;
use Sivujetti\ValidationUtils;

final class Uploader {
    public const DEFAULT_MAX_SIZE_B = 1024 * 1024 * 8;
    /** @var \Sivujetti\Upload\MimeValidator */
    private MimeValidator $mimeValidator;
    /** @var \Closure */
    private \Closure $moveUploadedFileFn;
    /**
     * @param \Sivujetti\Upload\MimeValidator $mimeValidator
     * @param ?callable $moveUploadedFileFn = "move_uploaded_file"
     */
    public function __construct(MimeValidator $mimeValidator,
                                ?callable $moveUploadedFileFn = null) {
        $this->mimeValidator = $mimeValidator;
        $this->moveUploadedFileFn = $moveUploadedFileFn instanceof \Closure
            ? $moveUploadedFileFn
            : \Closure::fromCallable("move_uploaded_file");
    }
    /**
     * @param array<string, mixed> $file ["size" => int, "tmp_name" => string, "name" => string]
     * @param string $toDir An absolute path to the target directory, must exist
     * @param string $targetFileName
     * @param int $maxSize = self::DEFAULT_MAX_SIZE_B Bytes
     * @param ?array $allowedMimes = null
     * @return \Sivujetti\Upload\Entities\UploadsEntry
     * @throws \Pike\PikeException
     */
    public function upload(array $file,
                           string $toDir,
                           string $targetFileName,
                           int $maxSize = self::DEFAULT_MAX_SIZE_B,
                           ?array $allowedMimes = null): UploadsEntry {
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
        // @allow \Pike\PikeException|\RuntimeException
        [$mime, $ext] = $this->mimeValidator->getAllowedMimeAndExt($file, $allowedMimes);
        if (!$mime || !$ext)
            throw new PikeException("You aren't permitted to upload this type of file");
        if ($ext !== substr($targetFileName, strrpos($targetFileName, ".") + 1))
            throw new \RuntimeException("Sanity check");
        //
        $out = new UploadsEntry;
        $out->fileName = $targetFileName;
        $out->baseDir = "";
        $out->mime = $mime;
        // friendlyName leave unset
        // createdAt leave unset
        // updatedAt leave unset
        //
        $basePath = FileSystem::normalizePath($toDir) . "/";
        if ($this->moveUploadedFileFn->__invoke(
            $file["tmp_name"],
            "{$basePath}{$out->baseDir}{$out->fileName}"
        )) {
            return $out;
        }
        throw new PikeException("Failed to move_uploaded_file()",
                                PikeException::FAILED_FS_OP);
    }
}
