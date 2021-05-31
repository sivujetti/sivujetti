<?php declare(strict_types=1);

define('KUURA_VERSION', '0.0.0-proto');

$config = (object)(require 'config.php');
$loader = require KUURA_BACKEND_PATH . 'vendor/autoload.php';
$loader->addPsr4('KuuraSite\\', KUURA_WORKSPACE_PATH . 'site');

// @todo handle Warning: Undefined array key "q"
\KuuraCms\App::create($config)->handleRequest(
    ...(!KUURA_QUERY_VAR ? ['', KUURA_BASE_URL] : [$_GET[KUURA_QUERY_VAR], null])
);
