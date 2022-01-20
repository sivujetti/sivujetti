<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use Pike\ArrayUtils;
use Pike\PikeException;
use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\App;
use Sivujetti\PageType\PageTypeMigrator;
use Sivujetti\Tests\Utils\{BlockTestUtils, HttpApiTestTrait};
use Sivujetti\TheWebsite\TheWebsiteRepository;

final class CreatePageTypeTest extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    protected BlockTestUtils $blockTestUtils;
    private const TEST_NAME = "MyCustomArticles";
    protected function setUp(): void {
        parent::setUp();
        $this->blockTestUtils = new BlockTestUtils;
    }
    protected function tearDown(): void {
        parent::tearDown();
        self::$db->exec("DELETE FROM `pageTypes` WHERE `name` = ?", [self::TEST_NAME]);
        self::$db->exec("DROP TABLE IF EXISTS `" . self::TEST_NAME . "`");
    }
    public function testCreatePageTypeInsertNewPageTypeWithOwnFieldsToDb(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
        $this->sendCreatePageTypeRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyCreatedPageTypeToDb($state);
    }
    private function setupTest(array $inputData = null, ?string $hints = null): \TestState {
        $state = new \TestState;
        $state->inputData = (object) array_merge(
            !$inputData || $hints === "completeBasicFields" ? [
                "name" => self::TEST_NAME,
                "slug" => "my-custom-articles",
                "friendlyName" => "Custom article",
                "friendlyNamePlural" => "Custom articles",
                "description" => "Foo bar",
                "defaultLayoutId" => "1",
                "isListable" => true,
            ] : [],
            $inputData ?? [
                "blockFields" => $this->createBlockFieldsInput(),
                "defaultFields" => self::createDefaultFieldsInput(),
                "ownFields" => self::createOwnFieldsInput(),
            ]
        );
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    private function makeTestSivujettiApp(\TestState $state): void {
        $state->app = $this->makeApp(fn() => App::create(self::setGetConfig()));
    }
    private function sendCreatePageTypeRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/page-types", "POST", $state->inputData));
    }
    private function verifyRequestFinishedSuccesfully(\TestState $state): void {
        $this->verifyResponseMetaEquals(201, "application/json", $state->spyingResponse);
    }
    private function verifyCreatedPageTypeToDb(\TestState $state): void {
        // Created the table?
        $c = require TEST_CONFIG_DIR_PATH . "config.php";
        $isSqlite = $c["db.driver"] === "sqlite";
        $row = $isSqlite
            ? self::$db->fetchOne("SELECT name, sql FROM sqlite_master" .
                                  " WHERE type = 'table' AND name = ?",
                                  [$state->inputData->name],
                                  \PDO::FETCH_ASSOC)
            : self::$db->fetchOne("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES".
                                  " WHERE TABLE_NAME = ? AND TABLE_SCHEMA = ?",
                                  [$state->inputData->name, $c["db.database"]],
                                  \PDO::FETCH_ASSOC);
        $this->assertNotNull($row);
        // Created custom fields?
        if (count($state->inputData->ownFields)) {
            $field1 = $state->inputData->ownFields[0];
            if ($isSqlite) $this->assertStringContainsString(
                "`{$field1->name}` TEXT,",
                $row["sql"]
            );
            else
                ; // Not implemented yet
        }
        //
        $all = (new TheWebsiteRepository())->fetchActive(self::$db)->pageTypes;
        $actual = ArrayUtils::findByKey($all, $state->inputData->name, "name");
        $this->assertNotNull($actual);
        $this->assertEquals($state->inputData->slug, $actual->slug);
        $this->assertEquals($state->inputData->friendlyName, $actual->friendlyName);
        $this->assertEquals($state->inputData->friendlyNamePlural, $actual->friendlyNamePlural);
        $this->assertEquals($state->inputData->description, $actual->description);
        $this->assertEquals($state->inputData->defaultLayoutId, $actual->defaultLayoutId);
        $this->assertEquals(self::createExpectedBlockFields($state), $actual->blockFields);
        $this->assertEquals(self::createExpectedDefaultFields($state), $actual->defaultFields);
        $this->assertEquals(self::createExpectedOwnFields($state), $actual->ownFields);
        $this->assertEquals($state->inputData->isListable, $actual->isListable);
    }
    private function createBlockFieldsInput(): array {
        $pure = $this->blockTestUtils->makeBlockData(
            propsData: (object) ["text" => "My page type's initial block", "cssClass" => ""],
            id: "@auto"
        );
        $pure->junk = "prop 1";
        return [$pure];
    }
    private static function createDefaultFieldsInput(): object {
        $pure = (object) ["title" => (object) ["defaultValue" => "<my type>'s title"]];
        $pure->junk = "prop 2";
        return $pure;
    }
    private static function createOwnFieldsInput(): array {
        return [(object) [
            "name" => "field1",
            "dataType" => (object) [
                "type" => "text",
                "junk" => "prop 4",
            ],
            "friendlyName" => "Field 1",
            "defaultValue" => "Hello",
            "isNullable" => false,
            "junk" => "prop 3",
        ]];
    }
    private static function createExpectedBlockFields(\TestState $state): array {
        return array_map([PageTypeMigrator::class, "inputToBlueprint"],
                         $state->inputData->blockFields);
    }
    private static function createExpectedDefaultFields(\TestState $state): object {
        return (object) ["title" => (object) [
            "defaultValue" => $state->inputData->defaultFields->title->defaultValue
        ]];
    }
    private static function createExpectedOwnFields(\TestState $state): array {
        $stripJunk = fn($itm) => (object) [
            "name" => $itm->name,
            "dataType" => (object) [
                "type" => $itm->dataType->type,
                "length" => null,
                "validationRules" => null,
            ],
            "friendlyName" => $itm->friendlyName,
            "defaultValue" => $itm->defaultValue,
            "isNullable" => $itm->isNullable,
        ];
        return array_map($stripJunk, $state->inputData->ownFields);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testCreatePageTypeInsertNewPageTypeWithoutOwnFieldsToDb(): void {
        $state = $this->setupTest();
        $state->inputData->ownFields = [];
        $this->makeTestSivujettiApp($state);
        $this->sendCreatePageTypeRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyCreatedPageTypeToDb($state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testCreatePageTypeRejectsInvalidBasicFieldsInputs(): void {
        $state = $this->setupTest([
            // Omit name, slug, friendlyName, friendlyNamePlural, description, defaultLayoutId, isListable
            "blockFields" => $this->createBlockFieldsInput(),
            "defaultFields" => self::createDefaultFieldsInput(),
            "ownFields" => self::createOwnFieldsInput(),
        ]);
        $this->makeTestSivujettiApp($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage(implode(PHP_EOL, [
            "name must contain only [a-zA-Z0-9_] and start with [a-zA-Z_]",
            "The length of name must be 64 or less",
            "The value of slug did not pass the regexp",
            "The length of slug must be 92 or less",
            "The length of friendlyName must be at least 1",
            "The length of friendlyName must be 92 or less",
            "The length of friendlyNamePlural must be at least 1",
            "The length of friendlyNamePlural must be 92 or less",
            "The length of description must be 1024 or less",
            "defaultLayoutId must be string",
            "isListable must be bool",
        ]));
        $this->sendCreatePageTypeRequest($state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testCreatePageTypeRejectsInvalidDefaultFieldsAndOwnFieldsInputs(): void {
        $state = $this->setupTest([
            "blockFields" => $this->createBlockFieldsInput(),
            "defaultFields" => (object) ["title" => (object) ["defaultValue" => "not supported yet"]],
            "ownFields" => [(object) ["nothing" => "here", "dataType" => (object) [
                "length" => "not-a-number",
                "validationRules" => "not-an-array"
            ]]],
        ], "completeBasicFields");
        $this->makeTestSivujettiApp($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage(implode(PHP_EOL, [
            "ownFields.0.name must contain only [a-zA-Z0-9_] and start with [a-zA-Z_]",
            "The length of ownFields.0.name must be 64 or less",
            "The length of ownFields.0.friendlyName must be at least 1",
            "The length of ownFields.0.friendlyName must be 92 or less",
            "The value of ownFields.0.dataType.type was not in the list",
            "ownFields.0.dataType.length must be int",
            "ownFields.0.dataType.validationRules must be array",
            "The length of ownFields.0.defaultValue must be 128000 or less",
            "ownFields.0.isNullable must be bool",
            "Invalid defaultFields",
        ]));
        $this->sendCreatePageTypeRequest($state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testCreatePageTypeRejectsInvalidBlockFieldsInputs(): void {
        $state = $this->setupTest([
            "blockFields" => [(object) ["type" => "not-valid-block"]],
            "defaultFields" => self::createDefaultFieldsInput(),
            "ownFields" => self::createOwnFieldsInput(),
        ], "completeBasicFields");
        $this->makeTestSivujettiApp($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage("Unknown block type `not-valid-block`");
        $this->sendCreatePageTypeRequest($state);
    }
}
