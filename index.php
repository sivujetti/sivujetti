<?php declare(strict_types=1);

define("SIVUJETTI_PUBLIC_PATH", str_replace("\\", "/", __DIR__) . "/");
define("SIVUJETTI_BACKEND_PATH", SIVUJETTI_PUBLIC_PATH . "backend/");

// Do not edit below this line -------------------------------------------------

$config = require "config.php";
$loader = require SIVUJETTI_BACKEND_PATH . "vendor/autoload.php";
$loader->addPsr4("MySite\\", SIVUJETTI_BACKEND_PATH . "site");
$loader->addPsr4("SitePlugins\\", SIVUJETTI_BACKEND_PATH . "plugins");

\Sivujetti\App::create($config)->handleRequest(
    ...(!SIVUJETTI_QUERY_VAR ? ["", SIVUJETTI_BASE_URL] : [$_GET[SIVUJETTI_QUERY_VAR], null])
);
