<?php

$statements = require dirname(__DIR__, 2) . "/installer/schema.sqlite.php";
$getRules = require dirname(__DIR__, 2) . "/installer/default-acl-rules.php";

$statements = array_merge($statements, [

"INSERT INTO `theWebsite` (`name`,`lang`,`aclRules`) VALUES
('Test suite website','fi','".json_encode($getRules())."')",

"INSERT INTO `pageTypes` VALUES
(1,'Pages','pages','" . json_encode([
    "ownFields" => [(object) ["name" => "categories", "dataType" => "many-to-many", "friendlyName" => "Categories", "defaultValue" => "[]"]],
    "blockFields" => [(object) ["type" => "Paragraph", "title" => "", "defaultRenderer" => "sivujetti:block-auto",
                                "initialData" => (object) ["text" => "Paragraph text", "cssClass" => ""],
                                "children" => []]],
    "defaultFields" => (object) ["title" => (object) ["defaultValue" => "New page"]],
]) . "','1',1)",

]);

return $statements;
