<?php

require __DIR__ . "/config.php";
define("TEST_CONFIG_DIR_PATH", str_replace("\\", "/", __DIR__) . "/");

class TestState extends \stdClass {
    //
}

$testSitePath = KUURA_BACKEND_PATH . "installer/sample-content/basic-site/";
$loader = require dirname(__DIR__, 2) . "/vendor/autoload.php";
$loader->addPsr4("KuuraCms\\Tests\\", __DIR__ . "/src");
$loader->addPsr4("KuuraCms\\Installer\\", KUURA_BACKEND_PATH . "installer/src");
$loader->addPsr4("KuuraCms\\Cli\\", KUURA_BACKEND_PATH . "cli/src");
$loader->addPsr4("KuuraCms\\Cli\\Tests\\", KUURA_BACKEND_PATH . "cli/tests");
$loader->addPsr4("MySite\\", $testSitePath . "site");
$loader->addPsr4("SitePlugins\\", $testSitePath . "plugins");
