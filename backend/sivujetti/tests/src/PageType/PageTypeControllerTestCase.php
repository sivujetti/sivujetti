<?php declare(strict_types=1);

namespace Sivujetti\Tests\PageType;

use Pike\ArrayUtils;
use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\App;
use Sivujetti\PageType\PageTypeMigrator;
use Sivujetti\Tests\Utils\{BlockTestUtils, HttpApiTestTrait};
use Sivujetti\TheWebsite\TheWebsiteRepository;

abstract class PageTypeControllerTestCase extends DbTestCase {
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
    protected function makeTestSivujettiApp(\TestState $state): void {
        $state->app = $this->makeApp(fn() => App::create(self::setGetConfig()));
    }
    protected function verifyPageTypeInDbEquals(object $expected, int $expectedStatus): void {
        $all = (new TheWebsiteRepository())->fetchActive(self::$db)->pageTypes;
        $actual = ArrayUtils::findByKey($all, $expected->name, "name");
        $this->assertNotNull($actual);
        $this->assertEquals($expected->slug, $actual->slug);
        $this->assertEquals($expected->friendlyName, $actual->friendlyName);
        $this->assertEquals($expected->friendlyNamePlural, $actual->friendlyNamePlural);
        $this->assertEquals($expected->description, $actual->description);
        $this->assertEquals($expected->defaultLayoutId, $actual->defaultLayoutId);
        $this->assertEquals(self::createExpectedBlockFields($expected), $actual->blockFields);
        $this->assertEquals(self::createExpectedDefaultFields($expected), $actual->defaultFields);
        $this->assertEquals(self::createExpectedOwnFields($expected), $actual->ownFields);
        $this->assertEquals($expectedStatus, $actual->status);
        $this->assertEquals($expected->isListable, $actual->isListable);
    }
    private static function createExpectedBlockFields(object $input): array {
        return array_map([PageTypeMigrator::class, "inputToBlueprint"],
                         $input->blockFields);
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
                "length" => null,
                "validationRules" => null,
            ],
            "friendlyName" => $itm->friendlyName,
            "defaultValue" => $itm->defaultValue,
            "isNullable" => $itm->isNullable,
        ];
        return array_map($stripJunk, $input->ownFields);
    }
}
