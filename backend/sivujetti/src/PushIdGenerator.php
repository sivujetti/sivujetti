<?php declare(strict_types=1);

namespace Sivujetti;

// https://gist.github.com/kiliman/ca1d9f4135078a6b24c5005113bbeea4
// https://gist.github.com/mikelehen/3596a30bd69384624c11
final class PushIdGenerator {
    // Modeled after base64 web-safe chars, but ordered by ASCII.
    private const PUSH_CHARS = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
    /**
     * Timestamp of last push, used to prevent local collisions if you push twice in one ms.
     *
     * @var float
     */
    private static $lastPushTime = 0.0;
    /**
     * We generate 72-bits of randomness which get turned into 12 characters and appended to the
     * timestamp to prevent collisions with other clients.  We store the last characters we
     * generated because in the event of a collision, we"ll use those same characters except
     * "incremented" by one.
     *
     * @var array<int, int>
     */
    private static $lastRandChars = [];
    /**
     * @return string
     */
    public static function generatePushId(): string {
        $now = floor(microtime(true) * 1000);
        $duplicateTime = ($now === self::$lastPushTime);
        self::$lastPushTime = $now;

        $id = "";
        for ($i = 7; $i >= 0; $i--) {
            $id .= self::PUSH_CHARS[$now % 64];
            $now = floor($now / 64);
        }
        if ((int)$now !== 0) throw new \RuntimeException("We should have converted the entire timestamp.");

        if (!$duplicateTime) {
            for ($i = 0; $i < 12; $i++) {
                self::$lastRandChars[$i] = rand(0, 63);
            }
        } else {
            // If the timestamp hasn"t changed since last push, use the same random number, except incremented by 1.
            for ($i = 11; $i >= 0 && self::$lastRandChars[$i] === 63; $i--) {
                self::$lastRandChars[$i] = 0;
            }
            self::$lastRandChars[$i]++;
        }
        for ($i = 0; $i < 12; $i++) {
            $id .= self::PUSH_CHARS[self::$lastRandChars[$i]];
        }
        if (strlen($id) !== 20) throw new \RuntimeException("Length should be 20.");

        return $id;
    }
}
