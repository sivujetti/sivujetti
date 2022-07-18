<?php declare(strict_types=1);

namespace Sivujetti\Tests\GlobalBlockTree;

use Sivujetti\Block\BlockTree;

final class GetGlobalBlockTreesTest extends GlobalBlockTreesControllerTestCase {
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
            "id" => "-1234567890abcdefghi",
            "name" => $state->inputData->name,
            "blocks" => BlockTree::toJson($state->inputData->blocks)
        ];
        return $state;
    }
    protected function insertTestGlobalBlockTreeToDb(\TestState $state, object $d = null): void {
        $this->dbDataHelper->insertData($d ?? $state->testGlobalBlockTree, "globalBlockTrees");
    }
    private function sendGetGlobalBlockTreeByIdRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/global-block-trees/{$state->testGlobalBlockTree->id}", "GET"));
    }
    private function verifyReturnedSingleGlobalBlockTree(\TestState $state): void {
        $actual = json_decode($state->spyingResponse->getActualBody(), flags: JSON_THROW_ON_ERROR);
        $this->assertEquals($state->testGlobalBlockTree->name, $actual->name);
        $this->assertEquals(json_decode($state->testGlobalBlockTree->blocks), $actual->blocks);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testListGlobalBlocksListsGlobalBlockTreesFromDb(): void {
        $state = $this->setupListTest();
        $this->insertTestGlobalBlockTreeToDb($state);
        $this->insertTestGlobalBlockTreeToDb($state, $state->testGlobalBlockTree2);
        $this->makeTestSivujettiApp($state);
        $this->sendListGlobalBlockTreesRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyListedAllGlobalBlockTrees($state);
    }
    protected function setupListTest(): \TestState {
        $state = $this->setupTest();
        $state->testGlobalBlockTree2 = clone $state->testGlobalBlockTree;
        $state->testGlobalBlockTree2->id[1] = "2";
        return $state;
    }
    private function sendListGlobalBlockTreesRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/global-block-trees", "GET"));
    }
    private function verifyListedAllGlobalBlockTrees(\TestState $state): void {
        $actual = json_decode($state->spyingResponse->getActualBody(), flags: JSON_THROW_ON_ERROR);
        $this->assertCount(2, $actual);
        usort($actual, fn($a, $b) => $a->name <=> $b->name);
        $this->assertEquals($state->testGlobalBlockTree->name, $actual[0]->name);
        $this->assertEquals(json_decode($state->testGlobalBlockTree->blocks), $actual[0]->blocks);
        $this->assertEquals($state->testGlobalBlockTree2->name, $actual[1]->name);
        $this->assertEquals(json_decode($state->testGlobalBlockTree2->blocks), $actual[1]->blocks);
    }
}
