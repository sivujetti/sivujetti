<?php declare(strict_types=1);

if (php_sapi_name() === "cli")
    die("Browser required");
$urlToRedirectAfter = urldecode($_GET["urlToRedirectAfter"] ?? "");
if (!$urlToRedirectAfter)
    die("\?urlToRedirectAfter=<url> is required");

define("SIVUJETTI_INDEX_PATH", str_replace("\\", "/", dirname(__DIR__, 2)) . "/");
define("SIVUJETTI_BACKEND_PATH", SIVUJETTI_INDEX_PATH . "backend/");
define("SIVUJETTI_SITE_PATH", SIVUJETTI_BACKEND_PATH . "site/");
define("SIVUJETTI_PLUGINS_PATH", SIVUJETTI_BACKEND_PATH . "plugins/");

//-------------------------------------------------

$config = require SIVUJETTI_BACKEND_PATH . "sivujetti/tests/config.php";
$loader = require SIVUJETTI_BACKEND_PATH . "vendor/autoload.php";
$loader->addPsr4("MySite\\", SIVUJETTI_SITE_PATH);
$loader->addPsr4("SitePlugins\\", SIVUJETTI_PLUGINS_PATH);
$config["db.database"] = dirname(__DIR__) . "/temp-e2e-tests-db.db";

//-------------------------------------------------

$bootMod = new \Sivujetti\Boot\BootModule($config);
$di = new \Pike\Injector;
$bootMod->beforeExecCtrl($di);

$di->make(\Pike\NativeSession::class)->put("user", (object) [
    "id" => "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "role" => \Sivujetti\Auth\ACL::ROLE_SUPER_ADMIN,
]);
(new \Pike\Response)
    ->redirect($urlToRedirectAfter)
    ->commitIfReady();
