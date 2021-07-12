<?php declare(strict_types=1);

namespace KuuraCms\Tests\Block;

use KuuraCms\App;
use KuuraCms\Block\BlockTree;
use KuuraCms\Block\Entities\Block;
use KuuraCms\Tests\Utils\{BlockTestUtils, PageTestUtils};
use Pike\{Request, TestUtils\DbTestCase, TestUtils\HttpTestUtils};

final class AddBlockToPageTest extends DbTestCase {
    use HttpTestUtils;
    private BlockTestUtils $blockTestUtils;
    private PageTestUtils $pageTestUtils;
    protected function setUp(): void {
        parent::setUp();
        $this->pageTestUtils = new PageTestUtils(self::$db);
        $this->blockTestUtils = new BlockTestUtils($this->pageTestUtils);
    }
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
        $state->testPageBlocksTree = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_HEADING, ownProps: ["text" => "Hello", "level" => 2])
        ];
        $state->testPageData = (object) [
            "id" => "1001",
            "slug" => "/add-block-to-page-test-page",
            "path" => "/add-block-to-page-test-page",
            "level" => 1,
            "title" => "-",
            "layoutId" => 1,
            "blocks" => BlockTree::toJson($state->testPageBlocksTree),
            "categories" => "[]",
        ];
        $state->inputData = (object) [
            "id" => "-bbbbbbbbbbbbbbbbbb1",
            "type" => Block::TYPE_PARAGRAPH,
            "renderer" => "kuura:auto",
            "title" => "",
            "parentBlockId" => "",
            "pageId" => $state->testPageData->id,
            "text" => "My text",
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
            new Request("/api/blocks/to-page", "POST", $state->inputData));
    }
    private function verifyRequestFinishedSuccesfully(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
    }
    private function verifyInsertedBlockToDb(\TestState $state): void {
        $this->assertNotNull($this->blockTestUtils->getBlock(id: $state->inputData->id,
                                                             pageId: $state->inputData->pageId));
    }
}
