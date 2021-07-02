<?php

if (php_sapi_name() !== "cli")
    die("cli.php must be run on the command line.");

if (($argc ?? 0) < 2) die(
    "Usage: cli.php install-from-dir <relDirPath>"
);

define("KUURA_BACKEND_PATH", str_replace("\\", "/", __DIR__) . "/");
define("KUURA_PUBLIC_PATH", dirname(KUURA_BACKEND_PATH) . "/");

$loader = require KUURA_BACKEND_PATH . "vendor/autoload.php";
$loader->addPsr4("KuuraCms\\Cli\\", KUURA_BACKEND_PATH . "cli/src");
$loader->addPsr4("KuuraCms\\Installer\\", KUURA_BACKEND_PATH . "installer/src");

$app = \KuuraCms\Cli\App::create();
$path = implode("/", array_map("urlencode", array_slice($argv, 1)));
$app->handleRequest(new \Pike\Request("/{$path}", "PSEUDO:CLI"));
