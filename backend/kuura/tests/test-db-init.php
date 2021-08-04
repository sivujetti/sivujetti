<?php

$statements = require dirname(__DIR__, 2) . "/installer/schema.sqlite.php";
$getRules = require dirname(__DIR__, 2) . "/installer/default-acl-rules.php";

$statements = array_merge($statements, [

"INSERT INTO `theWebsite` VALUES
('Test suite website','fi','".json_encode($getRules())."',0)",

"INSERT INTO `pageTypes` VALUES
(1,'Pages','" . json_encode([
    (object) ["name" => "categories", "dataType" => "json", "friendlyName" => "Categories"]
]) . "','[]',1)",

]);

return $statements;
