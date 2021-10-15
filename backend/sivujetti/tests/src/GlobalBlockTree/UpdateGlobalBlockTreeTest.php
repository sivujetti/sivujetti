<?php declare(strict_types=1);

namespace Sivujetti\Tests\GlobalBlockTree;

use Pike\PikeException;
use Sivujetti\Block\{BlocksController, BlockTree};
use Sivujetti\Tests\Utils\PageTestUtils;

final class UpdateGlobalBlockTreeTest extends GlobalBlockTreeControllerTestCase {
    public function testUpdateGlobalBlockTreeBlocksWritesUpdatedDataToDb(): void {
        $state = $this->setupTest();
        $this->insertTestGlobalBlockTreeToDb($state);
        $this->makeTestSivujettiApp($state);
        $this->sendUpdateGlobalBlockTreeRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyWroteNewDataToDb($state);
    }
    protected function setupTest(): \TestState {
        $state = parent::setupTest();
        //
        $state->originalData = json_decode(json_encode($state->inputData));
        //
        $state->inputData->name = "My stored tree updated";
        $section = $state->inputData->blocks[0];
        $paragraph = $section->children[0];
        $paragraph->text = "© Year My Site Updated";
        //
        return $state;
    }
    private function insertTestGlobalBlockTreeToDb(\TestState $state): void {
        $data = clone $state->originalData;
        $data->blocks = BlockTree::toJson($state->originalData->blocks);
        $insertId = $this->dbDataHelper->insertData($data, "globalBlocks");
        $state->originalData->id = $insertId;
    }
    private function sendUpdateGlobalBlockTreeRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/global-block-trees/{$state->originalData->id}/blocks",
                "PUT", $state->inputData));
    }
    private function verifyRequestFinishedSuccesfully(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
    }
    private function verifyWroteNewDataToDb(\TestState $state): void {
        $actual = $this->dbDataHelper->getRow("globalBlocks",
                                              "`id` = ?",
                                              [$state->originalData->id]);
        $this->assertEquals($state->originalData->name, $actual["name"],
            "Shouldn't update name");
        $normalized = BlocksController::makeStorableBlocksDataFromValidInput($state->inputData->blocks,
            PageTestUtils::createTestAPIStorage()->getDataHandle()->blockTypes);
        $this->assertEquals(BlockTree::toJson($normalized),
                            $actual["blocks"]);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdateGlobalBlockTreeRejectsInvalidBlocksInput(): void {
        $state = $this->setupTest();
        $state->inputData->blocks = [(object) ["type" => "not-valid"]];
        $this->insertTestGlobalBlockTreeToDb($state);
        $this->makeTestSivujettiApp($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage("Unknown block type `not-valid`");
        $this->sendUpdateGlobalBlockTreeRequest($state);
    }
}
