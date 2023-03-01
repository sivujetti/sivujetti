<?php declare(strict_types=1);

namespace Sivujetti\Tests\ReusableBranch;

use Sivujetti\JsonUtils;

final class CreateReusableBranchTest extends ReusableBranchesControllerTestCase {
    public function testCreateReusableBranchInsertsReusableBranchesToDb(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
        $this->sendCreateReusableBranchRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyInsertedReusableBranchToDb($state);
    }
    protected function setupTest(): \TestState {
        $state = parent::setupTest();
        $temp = json_decode(json_encode($state->testReusableBranch));
        $temp->junk = "data";
        $temp->blockBlueprints = JsonUtils::parse($temp->blockBlueprints);
        $state->inputData = $temp;
        return $state;
    }
    private function sendCreateReusableBranchRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/reusable-branches", "POST", $state->inputData));
    }
    private function verifyInsertedReusableBranchToDb(\TestState $state): void {
        $actual = $this->dbDataHelper->getRow("reusableBranches",
                                              "`id` = ?",
                                              [$state->inputData->id]);
        $this->assertEquals(json_encode($state->inputData->blockBlueprints),
                            $actual["blockBlueprints"]);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testCreateReusableBranchRejectsInvalidInput(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
        //
        $state->inputData = (object) [];
        $this->sendCreateReusableBranchRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals(["id is not valid push id","The length of blockBlueprints must be at least 1"], $state->spyingResponse);
        //
        $state->inputData = (object) ["id" => $state->testReusableBranch->id,
            "blockBlueprints" => [(object) ["not" => "valid"]]];
        $this->sendCreateReusableBranchRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "The value of blockType was not in the list",
            "initialOwnData must be object",
            "Expected `initialDefaultsData` to be an object",
            "Expected `initialDefaultsData` to be an object",
            "Expected `initialDefaultsData` to be an object",
            "Expected `initialDefaultsData` to be an object",
            "Expected `initialDefaultsData` to be an object",
            "initialChildren must be array",
        ], $state->spyingResponse);
        //
        $state->inputData = (object) [
            "id" => $state->testReusableBranch->id,
            "blockBlueprints" => [(object) [
                "blockType" => "Text",
                "initialOwnData" => (object) [],
                "initialDefaultsData" => (object) ["not" => "valid"],
                "initialChildren" => [(object) ["not" => "valid"]]
            ]]
        ];
        $this->sendCreateReusableBranchRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "initialDefaultsData.title must be string",
            "The length of initialDefaultsData.title must be 1024 or less",
            "The value of initialDefaultsData.renderer was not in the list",
            "initialDefaultsData.styleClasses must be string",
            "The length of initialDefaultsData.styleClasses must be 1024 or less",
        ], $state->spyingResponse);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testCreateReusableBranchValidatesBlockblueprintsRecursively(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
        $state->inputData->blockBlueprints[0]->initialChildren = [(object) ["not" => "valid"]];
        $state->inputData = $state->inputData;
        $this->sendCreateReusableBranchRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "The value of blockType was not in the list",
            "initialOwnData must be object",
            "Expected `initialDefaultsData` to be an object",
            "Expected `initialDefaultsData` to be an object",
            "Expected `initialDefaultsData` to be an object",
            "Expected `initialDefaultsData` to be an object",
            "Expected `initialDefaultsData` to be an object",
            "initialChildren must be array",
        ], $state->spyingResponse);
    }
}
