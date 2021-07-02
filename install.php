<?php declare(strict_types=1);

define("KUURA_PUBLIC_PATH", str_replace("\\", "/", __DIR__) . "/");
define("KUURA_BACKEND_PATH", KUURA_PUBLIC_PATH . "backend/");

// Do not edit below this line -------------------------------------------------

$loader = require KUURA_BACKEND_PATH . "vendor/autoload.php";
$loader->addPsr4("KuuraCms\\Installer\\", KUURA_BACKEND_PATH . "installer/src");

$app = \KuuraCms\Installer\App::create();
$app->handleRequest($_GET["q"] ?? "/");
