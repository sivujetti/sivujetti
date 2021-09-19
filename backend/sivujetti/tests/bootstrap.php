<?php

require __DIR__ . "/config.php";
define("TEST_CONFIG_DIR_PATH", str_replace("\\", "/", __DIR__) . "/");

class TestState extends \stdClass {
    //
}

$testSitePath = SIVUJETTI_BACKEND_PATH . "installer/sample-content/basic-site/";
$loader = require dirname(__DIR__, 2) . "/vendor/autoload.php";
$loader->addPsr4("Sivujetti\\Tests\\", __DIR__ . "/src");
$loader->addPsr4("Sivujetti\\Installer\\", SIVUJETTI_BACKEND_PATH . "installer/src");
$loader->addPsr4("Sivujetti\\Cli\\", SIVUJETTI_BACKEND_PATH . "cli/src");
$loader->addPsr4("Sivujetti\\Cli\\Tests\\", SIVUJETTI_BACKEND_PATH . "cli/tests/src");
$loader->addPsr4("MySite\\", $testSitePath . "\$backend/site");
$loader->addPsr4("SitePlugins\\", $testSitePath . "\$backend/plugins");
