<?php declare(strict_types=1);

namespace Sivujetti\Tests\GlobalBlockTree;

use Pike\PikeException;
use Sivujetti\App;
use Sivujetti\Block\Entities\Block;
use Sivujetti\Tests\Utils\{BlockTestUtils, DbDataHelper, HttpApiTestTrait};
use Pike\TestUtils\{DbTestCase, HttpTestUtils};

final class CreateGlobalBlockTreeTest extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    private DbDataHelper $dbDataHelper;
    protected function setUp(): void {
        parent::setUp();
        $this->dbDataHelper = new DbDataHelper(self::$db);
    }
    public function testCreateGlobalBlockTreeInsertsDataToDb(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
        $this->sendCreateGlobalBlockTreeRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyInsertedGlobalBlockTreeToDb($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $btu = new BlockTestUtils();
        $state->inputData = (object) [
            "name" => "My footer",
            "blockTree" => [$btu->makeBlockData(Block::TYPE_SECTION, "Footer", "sivujetti:block-generic-wrapper", children: [
                $btu->makeBlockData(Block::TYPE_PARAGRAPH, propsData: ["text" => "© Year My Site", "cssClass" => ""]),
            ], propsData: ["bgImage" => "", "cssClass" => ""])]
        ];
        $state->actualInsertId = null;
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    private function makeTestSivujettiApp(\TestState $state): void {
        $state->app = $this->makeApp(fn() => App::create(self::setGetConfig()));
    }
    private function sendCreateGlobalBlockTreeRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/global-block-trees", "POST", $state->inputData));
    }
    private function verifyRequestFinishedSuccesfully(\TestState $state): void {
        $this->verifyResponseMetaEquals(201, "application/json", $state->spyingResponse);
        $state->actualInsertId = json_decode($state->spyingResponse->getActualBody())->insertId;
        $this->assertEquals("string", gettype($state->actualInsertId));
    }
    private function verifyInsertedGlobalBlockTreeToDb(\TestState $state): void {
        $actual = $this->dbDataHelper->getRow("globalBlocks",
                                              "`id` = ?",
                                              [$state->actualInsertId]);
        $this->assertEquals($state->inputData->name, $actual["name"]);
        $tree = json_decode($actual["blockTree"], flags: JSON_THROW_ON_ERROR);
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
            "The length of blockTree must be at least 1",
        ], $state->spyingResponse);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testCreateGlobalBlockTreeRejectsInvalidBlocksInput(): void {
        $state = $this->setupTest();
        $state->inputData->blockTree = [(object) ["type" => "not-valid"]];
        $this->makeTestSivujettiApp($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage("Unknown block type `not-valid`");
        $this->sendCreateGlobalBlockTreeRequest($state);
    }
}
