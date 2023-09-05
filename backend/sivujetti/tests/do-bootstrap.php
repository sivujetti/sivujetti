<?php

define("TEST_CONFIG_DIR_PATH", str_replace("\\", "/", __DIR__) . "/");
define("TEST_CONFIG_FILE_PATH", TEST_CONFIG_DIR_PATH . "config.php");
define("SIVUJETTI_UI_LANG", "en");

class TestState extends \stdClass {
    //
}

/**
 * @param ?string $testSitePath = null Default __DIR__ . "/test-site/"
 * @param ?string $testPluginsPath = null Default SIVUJETTI_BACKEND_PATH . "plugins/"
 * @param \Closure $alterPsr4Loader = null
 * @return array<string, mixed> Config
 */
return function (?string $testSitePath = null,
                 ?string $testPluginsPath = null,
                 ?\Closure $alterPsr4Loader = null): array {
    define("SIVUJETTI_BACKEND_PATH", str_replace("\\", "/", dirname(__DIR__, 2)) . "/");
    define("SIVUJETTI_INDEX_PATH", str_replace("\\", "/", dirname(SIVUJETTI_BACKEND_PATH)) . "/");
    define("SIVUJETTI_SITE_PATH", $testSitePath ?? (__DIR__ . "/test-site/"));
    define("SIVUJETTI_PLUGINS_PATH", $testPluginsPath ?? (SIVUJETTI_BACKEND_PATH . "plugins/"));

    // Defines SIVUJETTI_BASE_URL etc.
    $config = require __DIR__ . "/config.php";

    $loader = require SIVUJETTI_BACKEND_PATH . "vendor/autoload.php";
    $loader->addPsr4("Sivujetti\\Tests\\", __DIR__ . "/src");
    $loader->addPsr4("Sivujetti\\Installer\\", SIVUJETTI_BACKEND_PATH . "installer/src");
    $loader->addPsr4("Sivujetti\\Cli\\", SIVUJETTI_BACKEND_PATH . "cli/src");
    $loader->addPsr4("Sivujetti\\Cli\\Tests\\", SIVUJETTI_BACKEND_PATH . "cli/tests/src");
    $loader->addPsr4("MySite\\", SIVUJETTI_SITE_PATH);
    $loader->addPsr4("SitePlugins\\", SIVUJETTI_PLUGINS_PATH);
    if ($alterPsr4Loader)
        $alterPsr4Loader($loader);
    return $config;
};
