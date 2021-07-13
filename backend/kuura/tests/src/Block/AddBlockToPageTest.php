<?php declare(strict_types=1);

namespace KuuraCms\Tests\Block;

use KuuraCms\App;
use KuuraCms\Block\BlockTree;
use KuuraCms\Block\Entities\Block;
use KuuraCms\Tests\Utils\{BlockTestUtils, PageTestUtils};
use Pike\{PikeException, Request, TestUtils\DbTestCase, TestUtils\HttpTestUtils};

final class AddBlockToPageTest extends DbTestCase {
    use HttpTestUtils;
    private BlockTestUtils $blockTestUtils;
    private PageTestUtils $pageTestUtils;
    protected function setUp(): void {
        parent::setUp();
        $this->pageTestUtils = new PageTestUtils(self::$db);
        $this->blockTestUtils = new BlockTestUtils($this->pageTestUtils);
    }
    public function testAddBlockToPageRejectsInvalidInputs(): void {
        $state = $this->setupCreateBlockTest();
        $state->inputData = (object) ["type" => Block::TYPE_PARAGRAPH];
        $this->makeTestApp($state);
        $this->sendAddBlockToPageRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "title must be string",
            "The length of title must be 1024 or less",
            "The value of renderer was not in the list",
            "The length of id must be at least 20",
            "The length of id must be 20 or less",
            "parentBlockId must be string",
            "text must be string",
        ], $state->spyingResponse);
    }

    ////////////////////////////////////////////////////////////////////////////

    public function testAddBlockRejectsIfBlockTypeIsNotRegistered(): void {
        $state = $this->setupCreateBlockTest();
        $this->makeTestApp($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage("Couldn't add block to page" .
            " #{$state->testPageData->id} because it doesn't exist.");
        $this->sendAddBlockToPageRequest($state);
    }

    ////////////////////////////////////////////////////////////////////////////

    public function testAddBlockRejectsIfPageDoesNotExist(): void {
        $state = $this->setupCreateBlockTest();
        $state->inputData->type = "DoesNotExist";
        $this->makeTestApp($state);
        $this->insertTestPageToDb($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage("Unknown block type `DoesNotExist`.");
        $this->sendAddBlockToPageRequest($state);
    }

    ////////////////////////////////////////////////////////////////////////////

    public function testAddBlockRejectsIfParentBlockDoesNotExist(): void {
        $state = $this->setupCreateBlockTest();
        $state->inputData->parentBlockId = "-bbbbbbbbbbbbbbbb404";
        $this->makeTestApp($state);
        $this->insertTestPageToDb($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage("Couldn't add block because its parent" .
            " #{$state->inputData->parentBlockId} doesn't exist.");
        $this->sendAddBlockToPageRequest($state);
    }

    ////////////////////////////////////////////////////////////////////////////

    public function testAddBlockToPageInsertsNewBlockToDb(): void {
        $state = $this->setupCreateBlockTest();
        $this->makeTestApp($state);
        $this->insertTestPageToDb($state);
        $this->sendAddBlockToPageRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyInsertedBlockToDb($state);
    }
    private function setupCreateBlockTest(): \TestState {
        $state = new \TestState;
        $state->app = null;
        $testPageId = "1001";
        $state->inputData = (object) [
            "id" => "-bbbbbbbbbbbbbbbbbb1",
            "type" => Block::TYPE_PARAGRAPH,
            "renderer" => "kuura:block-auto",
            "title" => "",
            "parentBlockId" => "",
            "pageId" => $testPageId,
            "text" => "My text",
        ];
        $state->testPageBlocksTree = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_HEADING, propsData: ["text" => "Hello", "level" => 2])
        ];
        $state->testPageData = (object) [
            "id" => $testPageId,
            "slug" => "/add-block-to-page-test-page",
            "path" => "/add-block-to-page-test-page",
            "level" => 1,
            "title" => "-",
            "layoutId" => 1,
            "blocks" => BlockTree::toJson($state->testPageBlocksTree),
            "categories" => "[]",
        ];
        return $state;
    }
    private function insertTestPageToDb(\TestState $state): void {
        $this->pageTestUtils->insertPage($state->testPageData);
    }
    private function makeTestApp(\TestState $state): void {
        $state->app = $this->makeApp(fn() => App::create(self::setGetConfig()));
    }
    private function sendAddBlockToPageRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            new Request("/api/blocks/to-page/{$state->testPageData->id}",
                "POST", $state->inputData));
    }
    private function verifyRequestFinishedSuccesfully(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
    }
    private function verifyInsertedBlockToDb(\TestState $state): void {
        $this->assertNotNull($this->blockTestUtils->getBlock(id: $state->inputData->id,
                                                             pageId: $state->inputData->pageId));
    }
}
