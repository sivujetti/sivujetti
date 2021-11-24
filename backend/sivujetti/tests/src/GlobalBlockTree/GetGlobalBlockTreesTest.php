<?php declare(strict_types=1);

namespace Sivujetti\Tests\GlobalBlockTree;

use Sivujetti\Block\BlockTree;

final class GetGlobalBlockTreesTest extends GlobalBlockTreeControllerTestCase {
    public function testListGlobalBlocksListsGlobalBlockTreesFromDb(): void {
        $state = $this->setupTest();
        $this->insertTestGlobalBlockTreeToDb($state);
        $this->makeTestSivujettiApp($state);
        $this->sendListGlobalBlockTreesRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyListedAllGlobalBlockTrees($state);
    }
    protected function setupTest(): \TestState {
        $state = parent::setupTest();
        $state->testGlobalBlockTree = (object) [
            "name" => $state->inputData->name,
            "blocks" => BlockTree::toJson($state->inputData->blocks)
        ];
        return $state;
    }
    private function insertTestGlobalBlockTreeToDb(\TestState $state): void {
        $this->dbDataHelper->insertData($state->testGlobalBlockTree, "globalBlocks");
    }
    private function sendListGlobalBlockTreesRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/global-block-trees", "GET"));
    }
    private function verifyRequestFinishedSuccesfully(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
    }
    private function verifyListedAllGlobalBlockTrees(\TestState $state): void {
        $actual = $this->dbDataHelper->fetch("globalBlocks")->fetchAll();
        $this->assertCount(1, $actual);
        $this->assertEquals($state->testGlobalBlockTree->name, $actual[0]->name);
        $this->assertEquals($state->testGlobalBlockTree->blocks, $actual[0]->blocks);
    }
}
