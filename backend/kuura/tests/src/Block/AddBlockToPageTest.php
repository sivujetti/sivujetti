<?php declare(strict_types=1);

namespace KuuraCms\Tests\Block;

use KuuraCms\App;
use KuuraCms\Block\Entities\Block;
use KuuraCms\Tests\Utils\{BlockTestUtils, HttpApiTestTrait, PageTestUtils};
use Pike\{PikeException, TestUtils\DbTestCase, TestUtils\HttpTestUtils};

final class AddBlockToPageTest extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    private BlockTestUtils $blockTestUtils;
    private PageTestUtils $pageTestUtils;
    protected function setUp(): void {
        parent::setUp();
        $this->pageTestUtils = new PageTestUtils(self::$db);
        $this->blockTestUtils = new BlockTestUtils($this->pageTestUtils);
    }
    public function testAddBlockToPageInsertsNewBlockToDb(): void {
        $state = $this->setupCreateBlockTest();
        $this->makeKuuraApp($state);
        $this->insertTestPageToDb($state);
        $this->sendAddBlockToPageRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyInsertedBlockToDb($state);
    }
    private function setupCreateBlockTest(): \TestState {
        $state = new \TestState;
        $testPageId = "1001";
        $state->parentBlockId = "";
        $state->inputData = (object) [
            "id" => "-bbbbbbbbbbbbbbbbbb1",
            "type" => Block::TYPE_PARAGRAPH,
            "renderer" => "kuura:block-auto",
            "title" => "",
            "pageId" => $testPageId,
            "text" => "My text",
        ];
        $state->testPageBlocksTree = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_HEADING, propsData: ["text" => "Hello", "level" => 2])
        ];
        $state->testPageData = $this->pageTestUtils->makeTestPageData($state->testPageBlocksTree);
        $state->testPageData->id = $testPageId;
        $state->testPageData->slug = "/add-block-to-page-test-page";
        $state->testPageData->path = "/add-block-to-page-test-page/";
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    private function insertTestPageToDb(\TestState $state): void {
        $this->pageTestUtils->insertPage($state->testPageData);
    }
    private function makeKuuraApp(\TestState $state): void {
        $state->app = $this->makeApp(fn() => App::create(self::setGetConfig()));
    }
    private function sendAddBlockToPageRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/blocks/to-page/{$state->testPageData->id}" .
            ($state->parentBlockId ? "/{$state->parentBlockId}" : ""),
                "POST", $state->inputData));
    }
    private function verifyRequestFinishedSuccesfully(\TestState $state): void {
        $this->verifyResponseMetaEquals(201, "application/json", $state->spyingResponse);
    }
    private function verifyInsertedBlockToDb(\TestState $state): void {
        $this->assertNotNull($this->blockTestUtils->getBlock(id: $state->inputData->id,
                                                             pageId: $state->inputData->pageId));
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testAddBlockToPageRejectsInvalidInputs(): void {
        $state = $this->setupCreateBlockTest();
        $state->inputData = (object) ["type" => Block::TYPE_PARAGRAPH];
        $this->makeKuuraApp($state);
        $this->sendAddBlockToPageRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "title must be string",
            "The length of title must be 1024 or less",
            "The value of renderer was not in the list",
            "The length of id must be at least 20",
            "The length of id must be 20 or less",
            "text must be string",
            "The length of text must be 1024 or less",
        ], $state->spyingResponse);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testAddBlockRejectsIfBlockTypeIsNotRegistered(): void {
        $state = $this->setupCreateBlockTest();
        $this->makeKuuraApp($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage("Couldn't add block to page" .
            " #{$state->testPageData->id} because it doesn't exist.");
        $this->sendAddBlockToPageRequest($state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testAddBlockRejectsIfPageDoesNotExist(): void {
        $state = $this->setupCreateBlockTest();
        $state->inputData->type = "DoesNotExist";
        $this->makeKuuraApp($state);
        $this->insertTestPageToDb($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage("Unknown block type `DoesNotExist`.");
        $this->sendAddBlockToPageRequest($state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testAddBlockRejectsIfParentBlockDoesNotExist(): void {
        $state = $this->setupCreateBlockTest();
        $state->parentBlockId = "-bbbbbbbbbbbbbbbb404";
        $this->makeKuuraApp($state);
        $this->insertTestPageToDb($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage("Couldn't add block because its parent" .
            " #{$state->parentBlockId} doesn't exist.");
        $this->sendAddBlockToPageRequest($state);
    }
}
