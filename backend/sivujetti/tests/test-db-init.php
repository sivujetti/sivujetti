<?php

$statements = require dirname(__DIR__, 2) . "/installer/schema.sqlite.php";
$getRules = require dirname(__DIR__, 2) . "/installer/default-acl-rules.php";

$statements = array_merge($statements, [

"INSERT INTO `theWebsite` (`name`,`lang`,`aclRules`) VALUES
('Test suite website','fi','".json_encode($getRules())."')",

"INSERT INTO `pageTypes` (`id`,`name`,`slug`,`friendlyName`,`friendlyNamePlural`,`description`" .
                          ",`fields`,`defaultLayoutId`,`status`,`isListable`) VALUES
(1,'Pages','pages','Page','Pages','','" . json_encode([
    "ownFields" => [(object) [
        "name" => "categories",
        "friendlyName" => "Categories",
        "dataType" => (object) ["type" => "many-to-many"],
        "defaultValue" => "[]",
        "isNullable" => false,
    ]],
    "blockFields" => [(object) ["type" => "Paragraph", "title" => "", "defaultRenderer" => "sivujetti:block-auto",
                                "initialData" => (object) ["text" => "Paragraph text", "cssClass" => ""],
                                "children" => []]],
    "defaultFields" => (object) ["title" => (object) ["defaultValue" => "New page"]],
]) . "','1',0,1)",

]);

return $statements;
