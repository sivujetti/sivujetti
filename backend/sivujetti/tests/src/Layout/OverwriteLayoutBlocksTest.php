<?php declare(strict_types=1);

namespace Sivujetti\Tests\Layout;

use Sivujetti\App;
use Sivujetti\Block\Entities\Block;
use Sivujetti\Tests\Utils\{BlockTestUtils, HttpApiTestTrait};
use Pike\{PikeException, TestUtils\DbTestCase, TestUtils\HttpTestUtils};
use Sivujetti\Block\BlockTree;
use Sivujetti\BlockType\Entities\BlockTypes;
use Sivujetti\Layout\LayoutBlocksRepository;

final class OverwriteLayoutBlocksTest extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    private LayoutBlocksRepository $layoutBlocksRepo;
    protected function setUp(): void {
        parent::setUp();
        $this->layoutBlocksRepo = new LayoutBlocksRepository(self::$db, new BlockTypes);
    }
    public function testOverwriteLayoutBlocksSavesNewBlocksToDb(): void {
        $state = $this->setupTest();
        $this->makeSivujettiApp($state);
        $this->insertTestLayoutBlocksDataToDb($state);
        $this->sendOverwriteLayoutBlocksRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyOverwroteLayoutBlocksToDb($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $btu = new BlockTestUtils();
        $state->testLayoutBlocksData = (object) [
            "blocks" => BlockTree::toJson([
                $btu->makeBlockData(Block::TYPE_PARAGRAPH, propsData: ["text" => "Initial", "cssClass" => ""])
            ]),
            "layoutId" => "1",
        ];
        $state->inputData = (object) ["blocks" =>
            [$btu->makeBlockData(Block::TYPE_PARAGRAPH, propsData: ["text" => "Updated", "cssClass" => ""])]
        ];
        $state->inputData->blocks[0]->id[-1] = "c";
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    private function makeSivujettiApp(\TestState $state): void {
        $state->app = $this->makeApp(fn() => App::create(self::setGetConfig()));
    }
    private function insertTestLayoutBlocksDataToDb(\TestState $state): void {
        [$qList, $values, $columns] = self::$db->makeInsertQParts($state->testLayoutBlocksData);
        self::$db->exec("INSERT INTO `\${p}layoutBlocks` ({$columns})" .
                        " VALUES ({$qList})", $values);
    }
    private function sendOverwriteLayoutBlocksRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest($this->createApiRequest(
            "/api/layouts/{$state->testLayoutBlocksData->layoutId}/blocks",
            "PUT",
            $state->inputData));
    }
    private function verifyRequestFinishedSuccesfully(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
    }
    private function verifyOverwroteLayoutBlocksToDb(\TestState $state): void {
        $actual = $this->layoutBlocksRepo->getMany($state->testLayoutBlocksData->layoutId)[0];
        $this->assertCount(1, $actual->blocks);
        $this->assertEmpty($actual->blocks[0]->children);
        $this->assertEquals($state->inputData->blocks[0]->type, $actual->blocks[0]->type);
        $this->assertEquals($state->inputData->blocks[0]->id, $actual->blocks[0]->id);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testOverwriteLayoutBlocksRejectsInvalidInputs(): void {
        $state = $this->setupTest();
        $state->inputData = (object) ["blocks" => [(object) ["type" => "not-valid", "cssClass" => ""]]];
        $this->makeSivujettiApp($state);
        $this->insertTestLayoutBlocksDataToDb($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage("Unknown block type `not-valid`");
        $this->sendOverwriteLayoutBlocksRequest($state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testOverwriteLayoutRejectsIfLayoutDoesNotExist(): void {
        $state = $this->setupTest();
        $state->testLayoutBlocksData->layoutId = "4040";
        $this->makeSivujettiApp($state);
        $this->expectException(PikeException::class);
        $this->sendOverwriteLayoutBlocksRequest($state);
    }
}
