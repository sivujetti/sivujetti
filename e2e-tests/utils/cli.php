<?php declare(strict_types=1);

if (php_sapi_name() !== "cli")
    die("cli.php must be run on the command line.");

if (($argc ?? 0) < 2) die(
    "Usage: cli.php e2e-mode begin <dataBundleName>\n" .
    "       cli.php e2e-mode end"
);

$t = dirname(__DIR__, 2) . "/backend/sivujetti/tests/do-bootstrap.php";
$doBootstrap = require dirname(__DIR__, 2) . "/backend/sivujetti/tests/do-bootstrap.php";
$config = $doBootstrap(
    // Use default site path (__DIR__ . "/test-site/")
    // Use default plugins path (SIVUJETTI_BACKEND_PATH . "plugins/")
    alterPsr4Loader: function ($loader) {
        $loader->addPsr4("Sivujetti\\E2eTests\\", __DIR__ . "/php-src");
    }
);
define("E2E_TEST_DB_PATH", dirname(__DIR__) . "/temp-e2e-tests-db.db");

$app = new \Pike\App;
$app->setModules([
    new \Sivujetti\E2eTests\Module($config),
]);
$path = implode("/", array_map("urlencode", array_slice($argv, 1)));
$app->handleRequest(new \Pike\Request("/{$path}", "PSEUDO:CLI"));
