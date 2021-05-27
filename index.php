<?php declare(strict_types=1);

define('KUURA_VERSION', '0.0.0-proto');

$config = (object)(require 'config.php');
$loader = require KUURA_BACKEND_PATH . 'vendor/autoload.php';

$app = \KuuraCms\App::create($config);
$app->handleRequest($_GET['q'] ?? '/');
