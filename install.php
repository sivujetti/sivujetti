<?php declare(strict_types=1);

$config = require 'config.php';
$loader = require KUURA_BACKEND_PATH . 'vendor/autoload.php';
$loader->addPsr4('KuuraSite\\', KUURA_WORKSPACE_PATH . 'site');
$loader->addPsr4('KuuraPlugins\\', KUURA_WORKSPACE_PATH . 'plugins');

$data = require KUURA_WORKSPACE_PATH . 'install-data.php';
(new \KuuraCms\TempInstaller($config, [
    'assoc' => \KuuraCms\AssociativeJoinStorageStrategy::class,
    'embedded' => \KuuraCms\EmbeddedDataStorageStrategy::class,
][$_GET['strat'] ?? 'assoc']))->install($data);
echo 'ok';
