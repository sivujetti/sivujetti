<?php declare(strict_types=1);

namespace Sivujetti\Tests\Block;

use Sivujetti\Block\BlockTree;
use Sivujetti\Block\Entities\Block;
use Sivujetti\Tests\Utils\DbDataHelper;

final class ListGlobalBlockTreeBlocksTest extends RenderBlocksTestCase {
    protected DbDataHelper $dbDataHelper;
    protected function setUp(): void {
        parent::setUp();
        $this->dbDataHelper = new DbDataHelper(self::$db);
    }
    public function testListGlobalBlockTreeBlocksReturnsListOfBlocksByType(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
        $this->insertTestData($state);
        $this->sendListGlobalBlockTreeBlocksRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyReturnedBlocksWithType($state);
    }
    protected function setupTest(): \TestState {
        $state = parent::setupTest();
        $btu = $this->blockTestUtils;
        $state->testBlocks = [
            $btu->makeBlockData(Block::TYPE_PARAGRAPH, propsData: ["text" => "Foo", "cssClass" => ""],
                id: "@auto"),
            $btu->makeBlockData(Block::TYPE_HEADING, propsData: ["text" => "Fos", "level" => 1, "cssClass" => ""],
                id: "@auto"),
            $btu->makeBlockData(Block::TYPE_PARAGRAPH, propsData: ["text" => "Bar", "cssClass" => ""],
                id: "@auto"),
        ];
        $state->testGlobalBlockTree = (object) [
            // "id" will be set in $this->insertTestGlobalBlockTreeToDb()
            "name" => "Irrelevant",
            "blocks" => BlockTree::toJson($state->testBlocks)
        ];
        return $state;
    }
    private function insertTestData(\TestState $state): void {
        $insertId = $this->dbDataHelper->insertData($state->testGlobalBlockTree, "globalBlocks");
        $state->testGlobalBlockTree->id = $insertId;
    }
    private function sendListGlobalBlockTreeBlocksRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/blocks/" . Block::TYPE_PARAGRAPH, "GET"));
    }
    private function verifyReturnedBlocksWithType(\TestState $state): void {
        $parsed = json_decode($state->spyingResponse->getActualBody(), flags: JSON_THROW_ON_ERROR);
        $this->assertCount(2, $parsed);
        $this->assertEquals($parsed[0]->block->type, Block::TYPE_PARAGRAPH);
        $this->assertEquals($parsed[1]->block->type, Block::TYPE_PARAGRAPH);
        $this->assertEquals($parsed[1]->containingGlobalBlockTree->id, $state->testGlobalBlockTree->id);
    }
}
