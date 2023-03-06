<?php declare(strict_types=1);

namespace Sivujetti;

abstract class JsonUtils {
    /**
     * @param mixed $data
     * @param int $flags = JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR
     * @return string
     */
    public static function stringify(mixed $data, int $flags = JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR): string {
        return json_encode($data, $flags);
    }
    /**
     * @param string $json
     * @param int $flags = JSON_THROW_ON_ERROR
     * @param bool $asObject = true
     * @return mixed
     */
    public static function parse(string $json, int $flags = JSON_THROW_ON_ERROR, bool $asObject = true): mixed {
        return json_decode($json, associative: !$asObject, flags: $flags);
    }
}
