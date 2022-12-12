<?php declare(strict_types=1);

die("install.php is currently disabled. You can use `cli.php install-from-dir` instead.");

define("SIVUJETTI_INDEX_PATH", str_replace("\\", "/", __DIR__) . "/");
define("SIVUJETTI_BACKEND_PATH", SIVUJETTI_INDEX_PATH . "backend/");

// Do not edit below this line -------------------------------------------------

$loader = require SIVUJETTI_BACKEND_PATH . "vendor/autoload.php";
$loader->addPsr4("Sivujetti\\Installer\\", SIVUJETTI_BACKEND_PATH . "installer/src");

$app = \Sivujetti\Installer\App::create();
$app->handleRequest($_GET["q"] ?? "/");
