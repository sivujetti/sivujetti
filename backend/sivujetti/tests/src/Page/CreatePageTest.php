<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use Pike\ArrayUtils;
use Sivujetti\Block\Entities\Block;
use Sivujetti\Page\Entities\Page;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\Tests\Utils\{BlockTestUtils, PageTestUtils};

final class CreatePageTest extends PagesControllerTestCase {
    public function testCreateNormalPageInsertsPageToDb(): void {
        $state = $this->setupCreateNormalPageTest(addDefaultBlocks: true);
        $this->makeTestSivujettiApp($state);
        $this->sendCreatePageRequest($state);
        $this->verifyRequestFinishedSuccesfully($state, 201);
        $this->verifyInsertedPageToDb($state);
    }
    private function setupCreateNormalPageTest(bool $addDefaultBlocks = false): \TestState {
        $state = new \TestState;
        $state->inputData = (object) [
            "slug" => "/my-page",
            "path" => "/my-page/",
            "level" => 1,
            "title" => "My page",
            "meta" => (object) ["description" => "Description.",
                                "junk" => "data"],
            "layoutId" => "1",
            "blocks" => !$addDefaultBlocks ? [] : $this->pageTestUtils->makeTestPageData()->blocks,
            "status" => Page::STATUS_PUBLISHED,
            "categories" => [],
        ];
        $state->spyingResponse = null;
        $state->app = null;
        $this->pageTestUtils->layoutTestUtils->insertDefaultLayout();
        return $state;
    }
    private function sendCreatePageRequest(\TestState $state, string $pageTypeName = PageType::PAGE): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/pages/{$pageTypeName}", "POST", $state->inputData));
    }
    private function verifyInsertedPageToDb(\TestState $state): void {
        $actual = $this->pageTestUtils->getPageBySlug($state->inputData->slug);
        $createdAt = $actual->createdAt;
        $lastUpdatedAt = $actual->lastUpdatedAt;
        unset($actual->createdAt);
        unset($actual->lastUpdatedAt);
        $this->assertEquals([
            "slug" => $state->inputData->slug,
            "path" => $state->inputData->path,
            "level" => $state->inputData->level,
            "title" => $state->inputData->title,
            "meta" => PageTestUtils::createCleanMetaFromInput($state->inputData->meta),
            "layoutId" => $state->inputData->layoutId,
            "id" => $actual->id,
            "type" => PageType::PAGE,
            "status" => $state->inputData->status,
            "categories" => [],
        ], (array) $actual);
        $this->assertGreaterThan(time() - 3, $createdAt);
        $this->assertEquals($createdAt, $lastUpdatedAt);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testCreateNormalPageRejectsInvalidInputs(): void {
        $state = $this->setupCreateNormalPageTest(addDefaultBlocks: true);
        $state->inputData = (object) ["blocks" => $state->inputData->blocks];
        $this->makeTestSivujettiApp($state);
        $this->sendCreatePageRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "slug is not valid",
            "path must be string",
            "title must be string",
            "level must be number",
            "Expected `meta` to be an object",
            "Expected `meta` to be an object",
            "Expected `meta` to be an object",
            "Expected `meta` to be an object",
            "Expected `meta` to be an object",
            "Expected `meta` to be an object",
            "Expected `meta` to be an object",
            "layoutId must be number",
            "The value of layoutId must be 1 or greater",
            "status must be number",
            "The value of status must be 0 or greater",
            "categories must be array",
            "Expected `categories` to be an array",
        ], $state->spyingResponse);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testCreateNormalPageValidatesBlocksRecursively(): void {
        $state = $this->setupCreateNormalPageTest(addDefaultBlocks: false);
        $btu = new BlockTestUtils();
        $notValidBlock = (object) ["type" => Block::TYPE_TEXT];
        $validBlock = $btu->makeBlockData(Block::TYPE_SECTION, "Main", "sivujetti:block-generic-wrapper", children: [
            $notValidBlock,
        ], propsData: ["bgImage" => ""]);
        $state->inputData->blocks = [$validBlock];
        $this->makeTestSivujettiApp($state);
        $this->sendCreatePageRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $errors = json_decode($state->spyingResponse->getActualBody());
        $this->assertContains("The value of renderer was not in the list", $errors);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testCreateNormalPageWithSaveAwareBlocksPassesThemToOnBeforeSaveEvent(): void {
        $state = $this->setupCreateNormalPageTest(addDefaultBlocks: false);
        $this->registerTestCustomBlockType();
        $state->inputData->blocks = [(new BlockTestUtils())->makeBlockData("Icon",
                propsData: ["iconId" => "check-circle"])];
        $this->makePagesControllerTestApp($state);
        $this->sendCreatePageRequest($state);
        $this->verifyRequestFinishedSuccesfully($state, 201);
        $actual = $this->pageTestUtils->getPageById(json_decode($state->spyingResponse->getActualBody())->insertId);
        $this->assertEquals("<svg>1", ArrayUtils::findByKey($actual->blocks[0]->propsData, "__alwaysAddedDynamicProp", "key")?->value);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testCreateNormalPageRejectsIfPageWithSameSlugAlreadyExists(): void {
        $state = $this->setupCreateDuplicateNormalPageTest();
        $state->inputData->slug = $state->testPageData->slug;
        $this->makeTestSivujettiApp($state);
        $this->insertTestPageDataToDb($state);
        $this->sendCreatePageRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "Page with identical slug already exists",
        ], $state->spyingResponse);
    }
    private function setupCreateDuplicateNormalPageTest(): \TestState {
        $state = $this->setupCreateNormalPageTest(addDefaultBlocks: true);
        $state->testPageData = $this->pageTestUtils->makeTestPageData();
        $state->testPageData->slug = "/try-to-create-duplicate-normal-page-test-page";
        $state->testPageData->path = "/try-to-create-duplicate-normal-page-test-page/";
        return $state;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testCreateCustomPageInsertsCustomPageAndItsCustomPropsToDb(): void {
        $state = $this->setupCreateCustomPageTest();
        $this->registerCustomPageType($state);
        $this->makeTestSivujettiApp($state);
        $this->sendCreatePageRequest($state, $state->customPageType->name);
        $this->verifyRequestFinishedSuccesfully($state, 201);
        $this->verifyInsertedCustomPageToDb($state);
        $this->dropCustomPageType($state);
    }
    private function setupCreateCustomPageTest(): \TestState {
        $state = $this->setupCreateNormalPageTest(addDefaultBlocks: true);
        $state->inputData->ownField1 = "Value";
        $state->inputData->ownField2 = 456;
        $state->customPageType = null;
        return $state;
    }
    private function registerCustomPageType(\TestState $state): void {
        $state->customPageType = $this->pageTestUtils->registerTestCustomPageType();
    }
    private function verifyInsertedCustomPageToDb(\TestState $state): void {
        $actual = $this->pageTestUtils->getPageBySlug($state->inputData->slug,
                                                      $state->customPageType);
        $createdAt = $actual->createdAt;
        $lastUpdatedAt = $actual->lastUpdatedAt;
        unset($actual->createdAt);
        unset($actual->lastUpdatedAt);
        $this->assertEquals([
            "slug" => $state->inputData->slug,
            "path" => $state->inputData->path,
            "level" => $state->inputData->level,
            "title" => $state->inputData->title,
            "meta" => PageTestUtils::createCleanMetaFromInput($state->inputData->meta),
            "layoutId" => $state->inputData->layoutId,
            "id" => $actual->id,
            "type" => $state->customPageType->name,
            "status" => $state->inputData->status,
            "ownField1" => $state->inputData->ownField1,
            "ownField2" => strval($state->inputData->ownField2),
        ], (array) $actual);
        $this->assertGreaterThan(time() - 3, $createdAt);
        $this->assertEquals($createdAt, $lastUpdatedAt);
    }
    private function dropCustomPageType(\TestState $state): void {
        $this->onTearDown = fn() => $this->pageTestUtils->dropCustomPageType($state->customPageType);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testCreateCustomPageRejectsInvalidOwnFieldsInputs(): void {
        $state = $this->setupCreateCustomPageTest();
        unset($state->inputData->ownField1);
        $state->inputData->ownField2 = [];
        $this->registerCustomPageType($state);
        $this->makeTestSivujettiApp($state);
        $this->sendCreatePageRequest($state, $state->customPageType->name);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "ownField1 must be string",
            "The length of ownField1 must be 1024 or less",
            "ownField2 must be number",
            "The value of ownField2 must be 0 or greater",
        ], $state->spyingResponse);
        $this->dropCustomPageType($state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testCustomPageRejectsIfPageWithSameSlugAlreadyExists(): void {
        $state = $this->setupCreateDuplicateCustomPageTest();
        $this->registerCustomPageType($state);
        $state->inputData->slug = $state->testPageData->slug;
        $this->makeTestSivujettiApp($state);
        $this->insertTestPageDataToDb($state, $state->customPageType);
        $this->sendCreatePageRequest($state, $state->customPageType->name);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "Page with identical slug already exists",
        ], $state->spyingResponse);
        $this->dropCustomPageType($state);
    }
    private function setupCreateDuplicateCustomPageTest(): \TestState {
        $state = $this->setupCreateCustomPageTest();
        $state->testPageData = $this->pageTestUtils->makeTestPageData();
        $state->testPageData->slug = "/try-to-create-duplicate-custom-page-test-page";
        $state->testPageData->path = "/try-to-create-duplicate-custom-page-test-page/";
        $state->testPageData->ownField1 = $state->inputData->ownField1;
        $state->testPageData->ownField2 = $state->inputData->ownField2;
        return $state;
    }
}
