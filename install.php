<?php declare(strict_types=1);

define('KUURA_BACKEND_PATH', __DIR__ . '/backend/'); // /kuura, /installer, /plugins etc.

// Do not edit below this line -------------------------------------------------

if (version_compare(phpversion(), '8.0.0', '<'))
    die('KuuraCMS requires PHP 8.0.0 or later.');
if (!function_exists('random_bytes'))
    die('!function_exists(\'random_bytes\') for some reason.');
if (!extension_loaded('pdo_mysql') && !extension_loaded('pdo_sqlite'))
    die("pdo_mysql OR pdo_sqlite is required by KuuraCMS.");
foreach (['mbstring', 'fileinfo'] as $ext)
    if (!extension_loaded($ext))
        die("{$ext} extension is required by KuuraCMS.");

define('KUURA_PUBLIC_PATH', __DIR__ . '/');
$loader = require KUURA_BACKEND_PATH . 'vendor/autoload.php';
$loader->addPsr4('KuuraCms\\Installer\\', KUURA_BACKEND_PATH . 'installer/src');

$app = \KuuraCms\Installer\App::create();
$app->handleRequest($_GET['q'] ?? '/');
