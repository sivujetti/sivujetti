<?php

define('KUURA_BACKEND_PATH', str_replace('\\', '/', dirname(__DIR__, 2)) . '/');
define('TEST_CONFIG_DIR_PATH', str_replace('\\', '/', __DIR__) . '/');

$loader = require KUURA_BACKEND_PATH . 'vendor/autoload.php';
$loader->addPsr4('KuuraCms\\Tests\\', __DIR__);
$loader->addPsr4('KuuraCms\\Installer\\', KUURA_BACKEND_PATH . 'installer/src');
$loader->addPsr4('KuuraCms\\Installer\\Tests\\', KUURA_BACKEND_PATH . 'installer/tests');
