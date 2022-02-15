<?php declare(strict_types=1);

namespace Sivujetti\Tests\GlobalBlockTree;

use Sivujetti\Block\BlockTree;

final class GetGlobalBlockTreesTest extends GlobalBlockTreeControllerTestCase {
    public function testGetGlobalBlockTreeByIdReturnsGlobalBlockTreeFromDb(): void {
        $state = $this->setupTest();
        $this->insertTestGlobalBlockTreeToDb($state);
        $this->makeTestSivujettiApp($state);
        $this->sendGetGlobalBlockTreeByIdRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyReturnedSingleGlobalBlockTree($state);
    }
    protected function setupTest(): \TestState {
        $state = parent::setupTest();
        $state->testGlobalBlockTree = (object) [
            // "id" will be set in $this->insertTestGlobalBlockTreeToDb()
            "name" => $state->inputData->name,
            "blocks" => BlockTree::toJson($state->inputData->blocks)
        ];
        return $state;
    }
    private function insertTestGlobalBlockTreeToDb(\TestState $state): void {
        $insertId = $this->dbDataHelper->insertData($state->testGlobalBlockTree, "globalBlocks");
        $state->testGlobalBlockTree->id = $insertId;
    }
    private function sendGetGlobalBlockTreeByIdRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/global-block-trees/{$state->testGlobalBlockTree->id}", "GET"));
    }
    private function verifyRequestFinishedSuccesfully(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
    }
    private function verifyReturnedSingleGlobalBlockTree(\TestState $state): void {
        $actual = json_decode($state->spyingResponse->getActualBody(), flags: JSON_THROW_ON_ERROR);
        $this->assertEquals($state->testGlobalBlockTree->name, $actual->name);
        $this->assertEquals(json_decode($state->testGlobalBlockTree->blocks), $actual->blocks);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testListGlobalBlocksListsGlobalBlockTreesFromDb(): void {
        $state = $this->setupTest();
        $this->insertTestGlobalBlockTreeToDb($state);
        $this->makeTestSivujettiApp($state);
        $this->sendListGlobalBlockTreesRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyListedAllGlobalBlockTrees($state);
    }
    private function sendListGlobalBlockTreesRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/global-block-trees", "GET"));
    }
    private function verifyListedAllGlobalBlockTrees(\TestState $state): void {
        $actual = json_decode($state->spyingResponse->getActualBody(), flags: JSON_THROW_ON_ERROR);
        $this->assertCount(1, $actual);
        $this->assertEquals($state->testGlobalBlockTree->name, $actual[0]->name);
        $this->assertEquals(json_decode($state->testGlobalBlockTree->blocks), $actual[0]->blocks);
    }
}
