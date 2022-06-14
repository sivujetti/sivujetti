<?php declare(strict_types=1);

define("SIVUJETTI_INDEX_PATH", str_replace("\\", "/", __DIR__) . "/");
define("SIVUJETTI_BACKEND_PATH", SIVUJETTI_INDEX_PATH . "backend/");
define("SIVUJETTI_SITE_PATH", SIVUJETTI_BACKEND_PATH . "site/");
define("SIVUJETTI_PLUGINS_PATH", SIVUJETTI_BACKEND_PATH . "plugins/");

// Do not edit below this line -------------------------------------------------

define("useReduxBlockTree", true);
$config = require "config.php";
$loader = require SIVUJETTI_BACKEND_PATH . "vendor/autoload.php";
$loader->addPsr4("MySite\\", SIVUJETTI_SITE_PATH);
$loader->addPsr4("SitePlugins\\", SIVUJETTI_PLUGINS_PATH);

$myExceptionHandler = function ($e) {
    $doDisplayErrors = (ini_get("display_errors") ?? "") === "1";
    http_response_code(500);
    if ($doDisplayErrors) throw $e;
    else echo "<h1>500 Internal Server Error</h1>
                An internal server error has been occurred.<br>
                Please try again later.";
};

if (!(SIVUJETTI_FLAGS & SIVUJETTI_DEVMODE))
    set_exception_handler($myExceptionHandler);
// else let the errors to be thrown

(new \Sivujetti\App($config))->handleRequest(
    ...(!SIVUJETTI_QUERY_VAR ? ["", SIVUJETTI_BASE_URL] : [$_GET[SIVUJETTI_QUERY_VAR] ?? "", null])
);
