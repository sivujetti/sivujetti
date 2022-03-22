<?php declare(strict_types=1);

namespace Sivujetti\Tests\GlobalBlockTree;

use Pike\PikeException;

final class CreateGlobalBlockTreeTest extends GlobalBlockTreesControllerTestCase {
    public function testCreateGlobalBlockTreeInsertsDataToDb(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
        $this->sendCreateGlobalBlockTreeRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyInsertedGlobalBlockTreeToDb($state);
    }
    protected function setupTest(): \TestState {
        $state = parent::setupTest();
        $state->actualInsertId = null;
        return $state;
    }
    private function sendCreateGlobalBlockTreeRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/global-block-trees", "POST", $state->inputData));
    }
    /** @override (\Sivujetti\Tests\Utils\HttpApiTestTrait) */
    protected function verifyRequestFinishedSuccesfully(\TestState $state, int $withStatus = 200): void {
        $this->verifyResponseMetaEquals(201, "application/json", $state->spyingResponse);
        $state->actualInsertId = json_decode($state->spyingResponse->getActualBody())->insertId;
        $this->assertEquals("string", gettype($state->actualInsertId));
    }
    private function verifyInsertedGlobalBlockTreeToDb(\TestState $state): void {
        $actual = $this->dbDataHelper->getRow("globalBlocks",
                                              "`id` = ?",
                                              [$state->actualInsertId]);
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
            "name must be string",
            "The length of name must be 92 or less",
            "The length of blocks must be at least 1",
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
