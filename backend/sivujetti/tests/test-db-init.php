<?php

require_once __DIR__ . "/src/Utils/CssGenTestUtils.php";
require_once __DIR__ . "/src/Utils/TestData.php";

$statements = require dirname(__DIR__, 2) . "/installer/schema.sqlite.php";
$getRules = require dirname(__DIR__, 2) . "/installer/default-acl-rules.php";
$blockTypeBaseStyles = \Sivujetti\Tests\Utils\TestData::getBlockTypeBaseStyles();

$statements = array_merge($statements, [

"INSERT INTO `theWebsite` (`name`,`lang`,`aclRules`,`firstRuns`) VALUES
('Test suite website','fi','".json_encode($getRules())."','".json_encode([
    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" => "y"
])."')",

"INSERT INTO `themes` (`id`,`name`,`globalStyles`,`isActive`" .
                       ",`generatedBlockTypeBaseCss`,`generatedBlockCss`) VALUES
('1','test-suite-theme','[]',1,'" .
    \Sivujetti\Tests\Utils\CssGenTestUtils::generateCachedBlockTypeBaseStyles($blockTypeBaseStyles)
. "','')",

"INSERT INTO `themeBlockTypeStyles` (`styles`,`blockTypeName`,`themeId`) VALUES
('{$blockTypeBaseStyles[0]->styles}','{$blockTypeBaseStyles[0]->blockTypeName}','1'),
('{$blockTypeBaseStyles[1]->styles}','{$blockTypeBaseStyles[1]->blockTypeName}','1')",

"INSERT INTO `pageTypes` (`id`,`name`,`slug`,`friendlyName`,`friendlyNamePlural`,`description`" .
                          ",`fields`,`defaultLayoutId`,`status`,`isListable`) VALUES
(1,'Pages','/pages','Page','Pages','','" . json_encode([
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
