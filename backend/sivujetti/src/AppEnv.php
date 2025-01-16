<?php declare(strict_types=1);

namespace Sivujetti;

use Pike\{Injector};

/**
 * @phpstan-type ConfigBundle array{app: array<string, mixed>, env: EnvConstants}
 * @phpstan-type EnvConstants array{BASE_URL: string, QUERY_VAR: string, SITE_SECRET: string, UPDATE_KEY: string, UPDATE_CHANNEL: string} & array<string, mixed>
 */
final class AppEnv {
    /** @var EnvConstants */
    public array $constants;
    /** @var \Pike\Injector $di */
    public Injector $di;
    /**
     * @return bool
     */
    public static function displayErrorsIsOn(): bool {
        // Note to self: ini_get() returns "1" or "0" for boolean values regardless
        // of their actual value in php.ini.
        return (ini_get("display_errors") ?? "") === "1";
    }
}
