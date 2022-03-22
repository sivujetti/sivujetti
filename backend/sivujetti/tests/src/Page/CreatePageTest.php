<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use Sivujetti\Block\Entities\Block;
use Sivujetti\Page\Entities\Page;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\Tests\Utils\{BlockTestUtils};
use Pike\{PikeException};

final class CreatePageTest extends PagesControllerTestCase {
    public function testCreateNormalPageInsertsPageToDb(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
        $this->sendCreatePageRequest($state);
        $this->verifyRequestFinishedSuccesfully($state, 201);
        $this->verifyInsertedPageToDb($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->inputData = (object) [
            "slug" => "/my-page",
            "path" => "/my-page/",
            "level" => 1,
            "title" => "My page",
            "layoutId" => "1",
            "blocks" => [],
            "status" => Page::STATUS_PUBLISHED,
            "categories" => "[]",
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
        $this->assertEquals([
            "slug" => $state->inputData->slug,
            "path" => $state->inputData->path,
            "level" => $state->inputData->level,
            "title" => $state->inputData->title,
            "layoutId" => $state->inputData->layoutId,
            "id" => $actual->id,
            "type" => PageType::PAGE,
            "status" => $state->inputData->status,
        ], (array) $actual);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testCreateNormalPageRejectsInvalidInputs(): void {
        $state = $this->setupTest();
        $state->inputData = (object) [];
        $this->makeTestSivujettiApp($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage(implode(PHP_EOL, [
            "slug must be string",
            "path must be string",
            "level must be number",
            "title must be string",
            "layoutId must be number",
            "The value of layoutId must be 1 or greater",
            "blocks must be array",
            "status must be number",
            "The value of status must be 0 or greater",
            "categories must be string",
        ]));
        $this->sendCreatePageRequest($state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testCreateNormalPageValidatesBlocksRecursively(): void {
        $state = $this->setupTest();
        $btu = new BlockTestUtils();
        $notValidBlock = (object) ["type" => Block::TYPE_PARAGRAPH];
        $validBlock = $btu->makeBlockData(Block::TYPE_SECTION, "Main", "sivujetti:block-generic-wrapper", children: [
            $notValidBlock,
        ], propsData: ["bgImage" => "", "cssClass" => ""]);
        $state->inputData->blocks = [$validBlock];
        $this->makeTestSivujettiApp($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage(implode(PHP_EOL, [
            "The value of renderer was not in the list",
        ]));
        $this->sendCreatePageRequest($state);
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
        $state = $this->setupTest();
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
        $this->assertEquals([
            "slug" => $state->inputData->slug,
            "path" => $state->inputData->path,
            "level" => $state->inputData->level,
            "title" => $state->inputData->title,
            "layoutId" => $state->inputData->layoutId,
            "id" => $actual->id,
            "type" => $state->customPageType->name,
            "status" => $state->inputData->status,
            "ownField1" => $state->inputData->ownField1,
            "ownField2" => $state->inputData->ownField2,
        ], (array) $actual);
    }
    private function dropCustomPageType(\TestState $state): void {
        $this->pageTestUtils->dropCustomPageType($state->customPageType);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testCreateCustomPageRejectsInvalidOwnFieldsInputs(): void {
        $state = $this->setupCreateCustomPageTest();
        unset($state->inputData->ownField1);
        $state->inputData->ownField2 = [];
        $this->registerCustomPageType($state);
        $this->makeTestSivujettiApp($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage(implode(PHP_EOL, [
            "ownField1 must be string",
            "The length of ownField1 must be 1024 or less",
            "ownField2 must be number",
            "The value of ownField2 must be 0 or greater",
        ]));
        $this->sendCreatePageRequest($state, $state->customPageType->name);
        $this->dropCustomPageType($state);
    }
}
