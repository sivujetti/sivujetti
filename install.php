<?php declare(strict_types=1);

define("KUURA_BACKEND_PATH", __DIR__ . "/backend/"); // /kuura, /installer, /plugins etc.

// Do not edit below this line -------------------------------------------------

define("KUURA_PUBLIC_PATH", __DIR__ . "/");
$loader = require KUURA_BACKEND_PATH . "vendor/autoload.php";
$loader->addPsr4("KuuraCms\\Installer\\", KUURA_BACKEND_PATH . "installer/src");

$app = \KuuraCms\Installer\App::create();
$app->handleRequest($_GET["q"] ?? "/");
