<?php declare(strict_types=1);

define("KUURA_VERSION", "0.1.0-dev");

$config = require "config.php";
$loader = require KUURA_BACKEND_PATH . "vendor/autoload.php";
$loader->addPsr4("MySite\\", KUURA_BACKEND_PATH . "site");
$loader->addPsr4("SitePlugins\\", KUURA_BACKEND_PATH . "plugins");

// @todo handle Warning: Undefined array key "q"
\KuuraCms\App::create($config)->handleRequest(
    ...(!KUURA_QUERY_VAR ? ["", KUURA_BASE_URL] : [$_GET[KUURA_QUERY_VAR], null])
);
