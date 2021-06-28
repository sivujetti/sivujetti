<?php

define("KUURA_BACKEND_PATH", str_replace("\\", "/", dirname(__DIR__, 2)) . "/");
define("TEST_CONFIG_DIR_PATH", str_replace("\\", "/", __DIR__) . "/");

class TestState extends \stdClass {
    //
}

$loader = require KUURA_BACKEND_PATH . "vendor/autoload.php";
$loader->addPsr4("KuuraCms\\Tests\\", __DIR__);
$loader->addPsr4("KuuraCms\\Installer\\", KUURA_BACKEND_PATH . "installer/src");
$loader->addPsr4("KuuraCms\\Cli\\", KUURA_BACKEND_PATH . "cli/src");
$loader->addPsr4("KuuraCms\\Cli\\Tests\\", KUURA_BACKEND_PATH . "cli/tests");
