<?php declare(strict_types=1);

define("SIVUJETTI_INDEX_PATH", str_replace("\\", "/", __DIR__) . "/");
define("SIVUJETTI_BACKEND_PATH", SIVUJETTI_INDEX_PATH . "backend/");
define("SIVUJETTI_SITE_PATH", SIVUJETTI_BACKEND_PATH . "site/");
define("SIVUJETTI_PLUGINS_PATH", SIVUJETTI_BACKEND_PATH . "plugins/");
define("SIVUJETTI_DEVMODE", 1 << 1);
define("SIVUJETTI_FLAGS",   SIVUJETTI_DEVMODE);
define("SIVUJETTI_UI_LANG", "en");

// Do not edit below this line -------------------------------------------------

$config = require "config.php";
$loader = require SIVUJETTI_BACKEND_PATH . "vendor/autoload.php";
$loader->addPsr4("MySite\\", SIVUJETTI_SITE_PATH);
$loader->addPsr4("SitePlugins\\", SIVUJETTI_PLUGINS_PATH);

require_once SIVUJETTI_BACKEND_PATH . "sivujetti/src/v-node-funcs.php";

$myExceptionHandler = function ($e) {
    http_response_code(500);
    if (\Sivujetti\AppEnv::displayErrorsIsOn()) throw $e;
    else echo "<h1>500 Internal Server Error</h1>
                An internal server error has been occurred.<br>
                Please try again later.";
};

$env = $config["env"];

if (!(SIVUJETTI_FLAGS & SIVUJETTI_DEVMODE))
    set_exception_handler($myExceptionHandler);
// else let the errors to be thrown

(new \Sivujetti\App($config))->handleRequest(
    ...(!$env["QUERY_VAR"] ? ["", $env["BASE_URL"]] : [$_GET[$env["QUERY_VAR"]] ?? "", null])
);
