<?php declare(strict_types=1);

namespace Sivujetti;

abstract class LogUtils {
    /**
     * @param \Exception $e
     * @return string
     */
    public static function formatError(\Exception $e): string {
        return "<<error_start>>\n" .
            "At `{$e->getFile()}` line {$e->getLine()}\n" .
            "-- Message ---\n" .
            "{$e->getMessage()}\n" .
            "-- Trace ---\n" .
            "{$e->getTraceAsString()}\n" .
        "<<error_end>>";
    }
}
