<?php

require_once __DIR__ . "/src/Utils/CssGenTestUtils.php";
require_once __DIR__ . "/src/Utils/TestData.php";

$statements = require dirname(__DIR__, 2) . "/installer/schema.sqlite.php";
$getRules = require dirname(__DIR__, 2) . "/installer/default-acl-rules.php";
$styles = \Sivujetti\Tests\Utils\TestData::getThemeStyles();

$statements = array_merge($statements, [

"INSERT INTO `theWebsite` (`name`,`lang`,`country`,`description`,`aclRules`,`firstRuns`,`versionId`) VALUES
('Test suitö website xss >','fi','FI','xss >','".json_encode($getRules())."','".json_encode([
    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" => "y"
])."','abcdefg1')",

"INSERT INTO `themes` (`id`,`name`,`stylesOrder`,`globalStyles`,`isActive`,`generatedScopedStylesCss`) VALUES
('1','test-suite-theme','" .
    json_encode(["Text", "Section"])
. "','[]',1,'" .
    \Sivujetti\Tests\Utils\CssGenTestUtils::generateScopedStyles($styles) .
"')",

"INSERT INTO `themeStyles` (`units`,`themeId`,`blockTypeName`) VALUES
('{$styles[0]->units}','1','{$styles[0]->blockTypeName}'),
('{$styles[1]->units}','1','{$styles[1]->blockTypeName}')",

"INSERT INTO `pageTypes` (`id`,`name`,`slug`,`friendlyName`,`friendlyNamePlural`,`description`" .
                          ",`fields`,`defaultLayoutId`,`status`,`isListable`) VALUES
(2,'PagesCategories','/pages-categories','Page category','Page categories','','" . json_encode([
    "ownFields" => [],
    "blockFields" => [(object) ["type" => "Text", "title" => "", "defaultRenderer" => "sivujetti:block-auto",
                                "initialData" => (object) ["html" => "<p>Category</p>"],
                                "children" => []]],
    "defaultFields" => (object) ["title" => (object) ["defaultValue" => "New category"]],
]) . "','1',0,1),
(1,'Pages','/pages','Page','Pages','','" . json_encode([
    "ownFields" => [(object) [
        "name" => "categories",
        "friendlyName" => "Categories",
        "dataType" => (object) ["type" => "many-to-many", "isNullable" => false, "rel" => "PagesCategories"],
        "defaultValue" => [],
    ]],
    "blockFields" => [(object) ["type" => "Text", "title" => "", "defaultRenderer" => "sivujetti:block-auto",
                                "initialData" => (object) ["text" => "<p>Paragraph text</p>"],
                                "children" => []]],
    "defaultFields" => (object) ["title" => (object) ["defaultValue" => "New page"]],
]) . "','1',0,1)",

]);

return $statements;
