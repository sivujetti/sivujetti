<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use Sivujetti\App;
use Sivujetti\Block\Entities\Block;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\Tests\Utils\{BlockTestUtils, HttpApiTestTrait, PageTestUtils};
use Pike\{PikeException, TestUtils\DbTestCase, TestUtils\HttpTestUtils};
use Sivujetti\Block\BlockTree;

final class UpdatePageTest extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    private PageTestUtils $pageTestUtils;
    protected function setUp(): void {
        parent::setUp();
        $this->pageTestUtils = new PageTestUtils(self::$db);
    }
    public function testUpdatePageWritesUpdatedDataToDb(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
        $this->insertTestPageDataToDb($state);
        $this->sendUpdatePageRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyWroteNewDataToDb($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->testPageData = $this->pageTestUtils->makeTestPageData();
        $state->testPageData->slug = "/update-page-test-page";
        $state->testPageData->path = "/update-page-test-page/";
        $state->inputData = (object) [
            "slug" => "/updated-update-page-test-page-slug",
            "path" => "/updated-update-page-test-page-slug/",
            "level" => "1",
            "title" => "Updated update page test page title",
            "layoutId" => $state->testPageData->layoutId . "2",
            "status" => $state->testPageData->status + 1,
            "categories" => $state->testPageData->categories,
        ];
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    private function makeTestSivujettiApp(\TestState $state): void {
        $state->app = $this->makeApp(fn() => App::create(self::setGetConfig()));
    }
    private function insertTestPageDataToDb(\TestState $state): void {
        $insertId = $this->pageTestUtils->insertPage($state->testPageData);
        $state->testPageData->id = $insertId;
    }
    private function sendUpdatePageRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest($this->createApiRequest(
            "/api/pages/" . PageType::PAGE . "/{$state->testPageData->id}",
            "PUT",
            $state->inputData));
    }
    private function verifyRequestFinishedSuccesfully(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
    }
    private function verifyWroteNewDataToDb(\TestState $state): void {
        $actual = $this->pageTestUtils->getPageById($state->testPageData->id);
        $this->assertEquals($state->inputData->slug, $actual->slug);
        $this->assertEquals($state->inputData->path, $actual->path);
        $this->assertEquals((int) $state->inputData->level, $actual->level);
        $this->assertEquals($state->inputData->title, $actual->title);
        $this->assertEquals($state->inputData->layoutId, $actual->layoutId);
        $this->assertEquals((int) $state->inputData->status, $actual->status);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdatePageRejectsInvalidInputs(): void {
        $state = $this->setupTest();
        $state->inputData = (object) [];
        $this->makeTestSivujettiApp($state);
        $this->insertTestPageDataToDb($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage(implode("\n", [
            "slug must be string",
            "path must be string",
            "level must be number",
            "title must be string",
            "layoutId must be number",
            "The value of layoutId must be 1 or greater",
            "status must be number",
            "The value of status must be 0 or greater",
            "categories must be string",
        ]));
        $this->sendUpdatePageRequest($state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdatePageDoesNotUpdateIdOrBlocks(): void {
        $state = $this->setupTest();
        $state->inputData->id = "updated-uuid";
        $state->inputData->blocks = BlockTree::toJson([$state->testPageData->blocks[0]->children[0]]);
        $this->makeTestSivujettiApp($state);
        $this->insertTestPageDataToDb($state);
        $this->sendUpdatePageRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyDidNotUpdateIdOrBlocksToDb($state);
    }
    private function verifyDidNotUpdateIdOrBlocksToDb(\TestState $state): void {
        $actual = $this->pageTestUtils->getPageById($state->testPageData->id);
        $original = $state->testPageData;
        $this->assertEquals($original->id, $actual->id);
        $this->assertEquals(array_map([Block::class, "fromObject"], $original->blocks),
                            $actual->blocks);
    }
}
