<?php declare(strict_types=1);

namespace Sivujetti;

use Pike\{FileSystem as PikeFileSystem, PikeException};

final class FileSystem extends PikeFileSystem {
    /**
     * @param string $dirPath
     * @param string $mustStartWith
     * @return ?string null or  $pathOfFailedItem
     */
    public function deleteFilesRecursive(string $dirPath, string $mustStartWith): ?string {
        ValidationUtils::checkIfValidaPathOrThrow($dirPath);
        ValidationUtils::checkIfValidaPathOrThrow($mustStartWith);
        if (!$mustStartWith)
            throw new PikeException("\$mustStartWith is required.",
                                    PikeException::BAD_INPUT);
        $toDeleteNormalized = self::normalizePath($dirPath);
        $mustStartWithNormalized = self::normalizePath($mustStartWith);
        if (strlen($mustStartWithNormalized) >= strlen($toDeleteNormalized))
            throw new PikeException("\$mustStartWith (`{$mustStartWithNormalized}`) must be shorter " .
                                    "than \$dirPath (`{$toDeleteNormalized}`).",
                                    PikeException::BAD_INPUT);
        if (!str_starts_with($toDeleteNormalized, "{$mustStartWithNormalized}/"))
            throw new PikeException("\$dirPath (`{$toDeleteNormalized}`) must start" .
                                    " with (`{$mustStartWithNormalized}/`).",
                                    PikeException::BAD_INPUT);
        //
        foreach ($this->readDir($dirPath, "{,.}*", GLOB_BRACE) as $path) {
            if (str_ends_with($path, ".") || str_ends_with($path, ".."))
                continue;
            if ($this->isFile($path)) {
                if (!$this->unlink($path)) return $path;
            } elseif (($failedItem = $this->deleteFilesRecursive($path, $mustStartWith))) {
                return $failedItem;
            }
        }
        return $this->rmDir($dirPath) ? null : $dirPath;
    }
}
