<?php declare(strict_types=1);

define("KUURA_PUBLIC_PATH", str_replace("\\", "/", __DIR__) . "/");
define("KUURA_BACKEND_PATH", KUURA_PUBLIC_PATH . "backend/");

// Do not edit below this line -------------------------------------------------

$config = require "config.php";
$loader = require KUURA_BACKEND_PATH . "vendor/autoload.php";
$loader->addPsr4("MySite\\", KUURA_BACKEND_PATH . "site");
$loader->addPsr4("SitePlugins\\", KUURA_BACKEND_PATH . "plugins");

\KuuraCms\App::create($config)->handleRequest(
    ...(!KUURA_QUERY_VAR ? ["", KUURA_BASE_URL] : [$_GET[KUURA_QUERY_VAR], null])
);
