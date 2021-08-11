<?php

if (php_sapi_name() !== "cli")
    die("cli.php must be run on the command line.");

if (($argc ?? 0) < 2) die(
    "Usage: cli.php install-from-dir <relDirPath>[ <baseUrl>]" .
    "       cli.php print-acl-rules"
);

define("SIVUJETTI_BACKEND_PATH", str_replace("\\", "/", __DIR__) . "/");
define("SIVUJETTI_PUBLIC_PATH", dirname(SIVUJETTI_BACKEND_PATH) . "/");

$loader = require SIVUJETTI_BACKEND_PATH . "vendor/autoload.php";
$loader->addPsr4("Sivujetti\\Cli\\", SIVUJETTI_BACKEND_PATH . "cli/src");
$loader->addPsr4("Sivujetti\\Installer\\", SIVUJETTI_BACKEND_PATH . "installer/src");

$app = \Sivujetti\Cli\App::create();
$path = implode("/", array_map("urlencode", array_slice($argv, 1)));
$app->handleRequest(new \Pike\Request("/{$path}", "PSEUDO:CLI"));