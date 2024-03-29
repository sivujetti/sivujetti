<?php declare(strict_types=1);

namespace Sivujetti\Tests\GlobalBlockTree;

use Pike\PikeException;

final class CreateGlobalBlockTreeTest extends GlobalBlockTreesControllerTestCase {
    public function testCreateGlobalBlockTreeInsertsDataToDb(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
        $this->sendCreateGlobalBlockTreeRequest($state);
        $this->verifyRequestFinishedSuccesfully($state, 201);
        $this->verifyInsertedGlobalBlockTreeToDb($state);
    }
    protected function setupTest(): \TestState {
        $state = parent::setupTest();
        return $state;
    }
    private function sendCreateGlobalBlockTreeRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/global-block-trees", "POST", $state->inputData));
    }
    private function verifyInsertedGlobalBlockTreeToDb(\TestState $state): void {
        $actual = $this->dbDataHelper->getRow("globalBlockTrees",
                                              "`id` = ?",
                                              [$state->inputData->id]);
        $this->assertEquals($state->inputData->name, $actual["name"]);
        $tree = json_decode($actual["blocks"], flags: JSON_THROW_ON_ERROR);
        $this->assertCount(1, $tree);
        $this->assertCount(1, $tree[0]->children);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testCreateGlobalBlockTreeRejectsInvalidBasicFieldsInput(): void {
        $state = $this->setupTest();
        $state->inputData = (object) [];
        $this->makeTestSivujettiApp($state);
        $this->sendCreateGlobalBlockTreeRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "id is not valid push id",
            "name must be string",
            "The length of name must be 92 or less",
        ], $state->spyingResponse);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testCreateGlobalBlockTreeRejectsInvalidBlocksInput(): void {
        $state = $this->setupTest();
        $state->inputData->blocks = [(object) ["type" => "not-valid"]];
        $this->makeTestSivujettiApp($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage("Unknown block type `not-valid`");
        $this->sendCreateGlobalBlockTreeRequest($state);
    }
}
