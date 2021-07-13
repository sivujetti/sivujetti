<?php declare(strict_types=1);

namespace KuuraCms;

use Pike\PikeException;

abstract class ValidationUtils {
    public const HARD_STRING_LIMIT = 1024;
    /**
     * Throws an exception if $path contains './', '../', or '/' (strict).
     *
     * @param string $path
     * @param bool $strict = false
     */
    public static function checkIfValidaPathOrThrow(string $path,
                                                    bool $strict = false): void {
        if (strpos($path, $strict ? '/' : './') !== false)
            throw new PikeException("`{$path}` is not valid path",
                                    PikeException::BAD_INPUT);
    }
}
