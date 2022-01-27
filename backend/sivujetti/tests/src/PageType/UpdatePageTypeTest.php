<?php declare(strict_types=1);

namespace Sivujetti\Tests\PageType;

use Pike\PikeException;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\PageType\{PageTypeMigrator};

final class UpdatePageTypeTest extends PageTypeControllerTestCase {
    protected const TEST_NAME = "MyCustomArticles";
    protected function tearDown(): void {
        parent::tearDown();
        self::$db->exec("DELETE FROM `pageTypes` WHERE `name` = ?", [self::TEST_NAME]);
        self::$db->exec("DROP TABLE IF EXISTS `" . self::TEST_NAME . "`");
    }
    public function testUpdatePlaceholderPageTypeUpdatesPageTypeToDb(): void {
        $state = $this->setupTest();
        $this->insertPlaceholderPageTypeToDb();
        $this->makeTestSivujettiApp($state);
        $this->sendUpdatePlaceholderPageTypeRequest($state);
        $this->verifyRequestReturnedSuccesfully($state);
        $this->verifyUpdatePageTypeToDb($state);
    }
    private function setupTest(array $inputData = null, ?string $hints = null): \TestState {
        $state = new \TestState;
        $state->inputData = (object) array_merge(
            $inputData === null || $hints === "completeBasicFields" ? [
                "name" => self::TEST_NAME,
                "slug" => "my-custom-articles",
                "friendlyName" => "Custom article",
                "friendlyNamePlural" => "Custom articles",
                "description" => "Foo bar",
                "defaultLayoutId" => "1",
                "status" => PageType::STATUS_DRAFT,
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
    private function createBlockFieldsInput(): array {
        $pure = $this->blockTestUtils->makeBlockData(
            propsData: (object) ["text" => "My page type's initial block", "cssClass" => ""],
            id: "@auto"
        );
        $pure->junk = "prop 1";
        return [$pure];
    }
    private static function createDefaultFieldsInput(): object {
        $pure = (object) ["title" => (object) ["defaultValue" => "New custom article"]];
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
    private function sendUpdatePlaceholderPageTypeRequest(\TestState $state, bool $asDraft = true): void {
        $url = "/api/page-types/" . PageTypeMigrator::MAGIC_PAGE_TYPE_NAME;
        if ($asDraft) $url .= "/as-placeholder";
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest($url, "PUT", $state->inputData));
    }
    private function verifyUpdatePageTypeToDb(\TestState $state, bool $asDraft = true): void {
        $s = $asDraft ? PageType::STATUS_DRAFT : PageType::STATUS_COMPLETE;
        $this->verifyPageTypeInDbEquals($state->inputData, $s);
    }
    private function verifyCreatedUnderlyingDataStore(\TestState $state): void {
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
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testCommitPlaceholderPageTypeUpdatesPageTypeAndCreatesDataStoreToDb(): void {
        $state = $this->setupTest();
        $this->insertPlaceholderPageTypeToDb();
        $this->makeTestSivujettiApp($state);
        $this->sendUpdatePlaceholderPageTypeRequest($state, asDraft: false);
        $this->verifyCreatedUnderlyingDataStore($state);
        $this->verifyUpdatePageTypeToDb($state, asDraft: false);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdatePlaceholderPageTypeRejectsInvalidBasicFieldsInputs(): void {
        $state = $this->setupTest([
            // Omit name, slug, friendlyName, friendlyNamePlural, description, defaultLayoutId, status, isListable
            "blockFields" => $this->createBlockFieldsInput(),
            "defaultFields" => self::createDefaultFieldsInput(),
            "ownFields" => self::createOwnFieldsInput(),
        ]);
        $this->insertPlaceholderPageTypeToDb();
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
            "The value of status was not in the list",
            "isListable must be bool",
        ]));
        $this->sendUpdatePlaceholderPageTypeRequest($state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdatePlaceholderPageTypeRejectsInvalidDefaultFieldsAndOwnFieldsInputs(): void {
        $state = $this->setupTest([
            "blockFields" => $this->createBlockFieldsInput(),
            "defaultFields" => (object) ["title" => (object) ["partial" => "object"]],
            "ownFields" => [(object) ["nothing" => "here", "dataType" => (object) [
                "length" => "not-a-number",
                "validationRules" => "not-an-array"
            ]]],
        ], "completeBasicFields");
        $this->insertPlaceholderPageTypeToDb();
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
            "The length of defaultFields.title.defaultValue must be 1024 or less",
        ]));
        $this->sendUpdatePlaceholderPageTypeRequest($state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdatePlaceholderPageTypeRejectsInvalidBlockFieldsInputs(): void {
        $state = $this->setupTest([
            "blockFields" => [(object) ["type" => "not-valid-block"]],
            "defaultFields" => self::createDefaultFieldsInput(),
            "ownFields" => self::createOwnFieldsInput(),
        ], "completeBasicFields");
        $this->insertPlaceholderPageTypeToDb();
        $this->makeTestSivujettiApp($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage("Unknown block type `not-valid-block`");
        $this->sendUpdatePlaceholderPageTypeRequest($state);
    }
}
