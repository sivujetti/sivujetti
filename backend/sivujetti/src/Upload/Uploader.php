<?php declare(strict_types=1);

namespace Sivujetti\Upload;

use Pike\{FileSystem, PikeException};
use Sivujetti\Upload\Entities\UploadsEntry;
use Sivujetti\ValidationUtils;

final class Uploader {
    public const DEFAULT_MAX_SIZE_B = 1024 * 1024 * 8;
    /** @var \Sivujetti\Upload\MimeValidator */
    private MimeValidator $mimeValidator;
    /** @var \Pike\FileSystem */
    private FileSystem $fs;
    /** @var \Closure */
    private \Closure $moveUploadedFileFn;
    /**
     * @param \Sivujetti\Upload\MimeValidator $mimeValidator
     * @param \Pike\FileSystem $fs
     * @param ?callable $moveUploadedFileFn = "move_uploaded_file"
     */
    public function __construct(MimeValidator $mimeValidator,
                                FileSystem $fs,
                                ?callable $moveUploadedFileFn = null) {
        $this->mimeValidator = $mimeValidator;
        $this->fs = $fs;
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
        $out->fileName = !$this->fs->isFile($targetFileName)
            ? $targetFileName
            : (self::qq($targetFileName) . ".{$ext}");
        $out->baseDir = "";
        $out->mime = $mime;
        // friendlyName leave unset
        // createdAt leave unset
        // updatedAt leave unset
        //
        $basePath = "{$this->fs->normalizePath($toDir)}/";
        if ($this->moveUploadedFileFn->__invoke(
            $file["tmp_name"],
            "{$basePath}{$out->baseDir}{$out->fileName}"
        )) {
            return $out;
        }
        throw new PikeException("Failed to move_uploaded_file()",
                                PikeException::FAILED_FS_OP);
    }
    /**
     * - In: "foo.png", Out "foo-1"
     * - In: "foo-bar.png", Out "foo-bar-1"
     * - In: "foo-1.png", Out "foo-2"
     *
     * @param string $candidate
     * @return string
     */
    private static function qq(string $candidate): string {
        /*
        1: "foo.png" -> "foo"
        2: "foo-bar.png" -> "foo-bar"
        3: "foo-1.png" -> "foo-1"
        */
        $noExt = substr($candidate, 0, strrpos($candidate, "."));
        /*
        1: "foo" -> ["foo"]
        2: "foo-bar" -> ["foo", "bar"]
        3: "foo-1" -> ["foo", "1"]
        */
        $pcs = explode("-", $noExt);
        $last = $pcs[count($pcs) - 1];

        if (strval((int)$last) === $last) {
            $pcs[count($pcs) - 1] = strval($last + 1); // ["foo", "1"] -> ["foo", "2"]
        } else { // [..., "bar"] -> [..., "bar", "1"]
            $pcs[] = "1";
        }

        return implode("-", $pcs);
    }
}
