<?php declare(strict_types=1);

namespace Sivujetti\Tests\PageType;

use Pike\ArrayUtils;
use Sivujetti\App;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\PageType\{PageTypeMigrator, PageTypesController};
use Sivujetti\TheWebsite\TheWebsiteRepository;

final class CreatePageTypeTest extends PageTypeControllerTestCase {
    public function testCreatePageTypeInsertsNewPageTypeWithOwnFieldsToDb(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
        $this->sendCreatePageTypeRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyCreatedPageTypeToDb($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    private function makeTestSivujettiApp(\TestState $state): void {
        $state->app = $this->makeApp(fn() => App::create(self::setGetConfig()));
    }
    private function sendCreatePageTypeRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/page-types/as-placeholder", "POST"));
    }
    private function verifyRequestFinishedSuccesfully(\TestState $state): void {
        $this->verifyResponseMetaEquals(201, "application/json", $state->spyingResponse);
    }
    private function verifyCreatedPageTypeToDb(\TestState $state): void {
        $all = (new TheWebsiteRepository())->fetchActive(self::$db)->pageTypes;
        $expected = PageTypesController::createEmptyPageType();
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
        $this->assertEquals(PageType::STATUS_DRAFT, $actual->status);
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
