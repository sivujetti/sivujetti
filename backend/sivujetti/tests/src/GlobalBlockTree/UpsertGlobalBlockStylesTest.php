<?php declare(strict_types=1);

namespace Sivujetti\Tests\GlobalBlockTree;

final class UpsertGlobalBlockStylesTest extends GlobalBlockTreesControllerTestCase {
    public function testUpsertGlobalBlockTreeBlocksUpdatesStyles(): void {
        $state = $this->setupTest();
        $this->insertTestGlobalBlockTreeToDb($state, $state->testGlobalBlockTreeData);
        $this->insertTestGlobalBlockStylesToDb($state);
        $this->makeTestSivujettiApp($state);
        $this->sendUpsertGlobalBlockStylesRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyOverwroteStylesToDb($state);
    }
    protected function setupTest(): \TestState {
        $state = new \TestState;
        $state->testGlobalBlockTreeData = $this->globalBlockTreeTestUtils->makeGlobalBlockTreeData();
        $state->originalData = $this->globalBlockTreeTestUtils->makeGlobalBlockStylesData($state->testGlobalBlockTreeData);
        $state->inputData = (object) ["styles" => json_decode($state->originalData->styles),
                                      "junk" => "junk-data-root"];
        $state->inputData->styles[0]->styles = "{ color: var(--updated) }";
        $state->inputData->styles[0]->junk = "junk-data-styles";
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    private function insertTestGlobalBlockStylesToDb(\TestState $state): void {
        $data = clone $state->originalData;
        unset($data->id);
        $insertId = $this->dbDataHelper->insertData($data, "globalBlocksStyles");
        $state->originalData->id = $insertId;
    }
    private function sendUpsertGlobalBlockStylesRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/global-block-trees/{$state->testGlobalBlockTreeData->id}/block-styles",
                "PUT", $state->inputData));
    }
    private function verifyOverwroteStylesToDb(\TestState $state): void {
        $actual = $this->dbDataHelper->getRow("globalBlocksStyles",
                                              "`globalBlockTreeId` = ?",
                                              [$state->testGlobalBlockTreeData->id]);
        $this->assertEquals($state->originalData->id, $actual["id"]);

        //
        $removeJunk = fn(object $input) => (object) [
            "blockId" => $input->blockId,
            "styles" => $input->styles,
        ];
        $this->assertEquals(array_map($removeJunk, $state->inputData->styles),
                            json_decode($actual["styles"]));
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpsertGlobalBlockTreeBlocksInsertsStylesIfNotYetCreated(): void {
        $state = $this->setupTest();
        unset($state->inputData->id);
        $this->insertTestGlobalBlockTreeToDb($state, $state->testGlobalBlockTreeData);
        $this->makeTestSivujettiApp($state);
        $this->sendUpsertGlobalBlockStylesRequest($state);
        $this->verifyRequestFinishedSuccesfully($state, 201);
        $this->verifyInsertedStylesToDb($state);
    }
    private function verifyInsertedStylesToDb(\TestState $state): void {
        $state->originalData->id = json_decode($state->spyingResponse->getActualBody())->insertId;
        $this->verifyOverwroteStylesToDb($state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpsertGlobalBlockTreeRejectsInvalidInput(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
        //
        $state->inputData = (object) [];
        $this->sendUpsertGlobalBlockStylesRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals(["Expected \$input->styles to be an array"], $state->spyingResponse);
        //
        $state->inputData = (object) ["styles" => ""];
        $this->sendUpsertGlobalBlockStylesRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals(["Expected \$input->styles to be an array"], $state->spyingResponse);
        //
        $state->inputData = (object) ["styles" => [""]];
        $this->sendUpsertGlobalBlockStylesRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals(["Expected \$input->styles[0] to be an object"], $state->spyingResponse);
        //
        $state->inputData = (object) ["styles" => [(object) ["junk" => "foo"]]];
        $this->sendUpsertGlobalBlockStylesRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals(["Expected \$input->styles[0]->styles to be a string"], $state->spyingResponse);
        //
        $state->inputData = (object) ["styles" => [(object) ["styles" => "not valid css %€&/="]]];
        $this->sendUpsertGlobalBlockStylesRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "styles.0.styles is not valid CSS",
            "The length of styles.0.blockId must be at least 20",
        ], $state->spyingResponse);
    }
}
