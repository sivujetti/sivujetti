<?php declare(strict_types=1);

namespace Sivujetti;

final class ShortIdGenerator {
    private const base62Chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    /** @var int */
    private static int $prevLargest = 0;
    /**
     * Generates approximately 11-character strings consisting of a base62-encoded unix
     * timestamp (with milliseconds) and a 4-character random portion. Example:
     *
     * ```php
     * $now = (int) date_create()->format("Uv"); // 1708429511346
     * $shortId = ShortIdGenerator::generate($now); // "u4Pi7F8a6jd"
     *
     * // "u4Pi7F8a6jd"
     * //     ^   ^
     * //     |   |
     * //     |   |______ Random portion, always 4 characters
     * //     |
     * //     |__________ Base62-encoded timestamp,
     * //                 typically 7 characters
     * ```
     *
     * @param ?int $t = unixTimeWithMillis($now)
     * @return string
     */
    public static function generate(?int $t = null): string {
        $nowMilli = $t ?? (PHP_INT_SIZE > 4
            ? (int) date_create()->format("Uv")
            : time()
        );
        if (!self::$prevLargest) {
            self::$prevLargest = $nowMilli;
            return self::genId($nowMilli);
        } else {
            if ($nowMilli > self::$prevLargest)
                self::$prevLargest = $nowMilli;
            else
               self::$prevLargest += 1;
            return self::genId(self::$prevLargest);
        }
    }
    /**
     * @param int $nowMilli
     * @return string
     */
    private static function genId(int $nowMilli): string {
        $timePart = self::base62Encode($nowMilli);

        $randomPart = "";
        for ($i = 0; $i < 4; ++$i)
            $randomPart .= self::base62Chars[random_int(0, 61)];

        return "{$timePart}{$randomPart}";
    }
    /**
     * @param string $shortId
     * @return object
     * @phpstan-return object{timestampWithMillis: int, randomPart: string}
     */
    public static function toComponents(string $shortId): array {
        $timePart = substr($shortId, 0, strlen($shortId) - 4);
        $randomPart = substr($shortId, strlen($shortId) - 4);
        $nowMilli = self::base62Decode($timePart);
        return [
            "timestampWithMillis" => $nowMilli,
            "randomPart" => $randomPart,
        ];
    }
    /**
     * Original code https://github.com/base62/base62.js/blob/9d980bb167408c0bfc61dfab28ae17bc95d0ba90/lib/ascii.js,
     * MIT-license.
     *
     * @param int $num
     * @return string
     */
    private static function base62Encode(int $num): string {
        $encoded = "";
        do {
            $encoded = self::base62Chars[$num % 62] . $encoded;
            $num = (int) floor($num / 62);
        } while ($num > 0);
        return $encoded;
    }
    /**
     * @param string $shortId
     * @return int
     */
    private static function base62Decode(string $shortId): int {
        $chars = str_split(self::base62Chars);
        $decoded = 0;
        foreach (str_split($shortId) as $c)
            $decoded = $decoded * 62 + array_search($c, $chars);
        return $decoded;
    }
    /**
     */
    public static function reset(): void {
        self::$prevLargest = 0;
    }
}
