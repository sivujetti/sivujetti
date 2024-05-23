<?php declare(strict_types=1);

namespace Sivujetti\Tests\PageType;

use Pike\ArrayUtils;
use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\PageType\{FieldCollection, PageTypeMigrator, PageTypesController};
use Sivujetti\Tests\Utils\{BlockTestUtils, DbDataHelper, HttpApiTestTrait};
use Sivujetti\TheWebsite\TheWebsiteRepository;

abstract class PageTypesControllerTestCase extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    protected BlockTestUtils $blockTestUtils;
    protected function setUp(): void {
        parent::setUp();
        $this->blockTestUtils = new BlockTestUtils;
    }
    protected function tearDown(): void {
        parent::tearDown();
        self::$db->exec("DELETE FROM `pageTypes` WHERE `name` = ?", [PageTypeMigrator::MAGIC_PAGE_TYPE_NAME]);
        self::$db->exec("DROP TABLE IF EXISTS `" . PageTypeMigrator::MAGIC_PAGE_TYPE_NAME . "`");
    }
    public static function getDbConfig(): array {
        return (require TEST_CONFIG_FILE_PATH)["app"];
    }
    protected function insertPlaceholderPageTypeToDb(): void {
        $dataHelper = (new DbDataHelper(self::$db));
        $pageTypeInput = PageTypesController::createEmptyPageTypeInput();
        $raawPageType = PageTypeMigrator::createRawPageType(
            $pageTypeInput,
            FieldCollection::fromValidatedInput($pageTypeInput->ownFields)
        );
        $dataHelper->insertData($raawPageType, "pageTypes");
    }
    protected function verifyRequestReturnedSuccesfully(\TestState $state, int $expectedStatusCode = 200): void {
        $this->verifyResponseMetaEquals($expectedStatusCode, "application/json", $state->spyingResponse);
        $actualBody = json_decode($state->spyingResponse->getActualBody(), flags: JSON_THROW_ON_ERROR);
        $this->assertEquals("ok", $actualBody->ok);
    }
    protected function verifyPageTypeInDbEquals(object $expected, int $expectedStatus): void {
        $Cls = "\\Pike\\Db\\FluentDb" . (!defined("USE_NEW_FLUENT_DB") ? "" : "2");
        $all = (new TheWebsiteRepository())->fetchActive(new $Cls(self::$db))->pageTypes;
        $actual = ArrayUtils::findByKey($all, $expected->name, "name");
        $this->assertNotNull($actual);
        $this->assertEquals($expected->slug, $actual->slug);
        $this->assertEquals($expected->friendlyName, $actual->friendlyName);
        $this->assertEquals($expected->friendlyNamePlural, $actual->friendlyNamePlural);
        $this->assertEquals($expected->description, $actual->description);
        $this->assertEquals($expected->defaultLayoutId, $actual->defaultLayoutId);
        $this->assertEquals(self::createExpectedBlockBlueprintFields($expected), $actual->blockBlueprintFields);
        $this->assertEquals(self::createExpectedDefaultFields($expected), $actual->defaultFields);
        $this->assertEquals(self::createExpectedOwnFields($expected), $actual->ownFields);
        $this->assertEquals($expectedStatus, $actual->status);
        $this->assertEquals($expected->isListable, $actual->isListable);
    }
    private static function createExpectedBlockBlueprintFields(object $input): array {
        return array_map([PageTypeMigrator::class, "inputToBlueprint"],
                         $input->blockBlueprintFields);
    }
    private static function createExpectedDefaultFields(object $input): object {
        return (object) ["title" => (object) [
            "defaultValue" => $input->defaultFields->title->defaultValue
        ]];
    }
    private static function createExpectedOwnFields(object $input): array {
        $stripJunk = fn($itm) => (object) [
            "name" => $itm->name,
            "dataType" => (object) [
                "type" => $itm->dataType->type,
                "isNullable" => $itm->dataType->isNullable,
                "length" => null,
                "validationRules" => null,
                "canBeEditedBy" => null,
            ],
            "friendlyName" => $itm->friendlyName,
            "defaultValue" => $itm->defaultValue,
        ];
        return array_map($stripJunk, $input->ownFields);
    }
}
