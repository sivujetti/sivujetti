<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use Sivujetti\Block\Entities\Block;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\Tests\Utils\{BlockTestUtils};
use Pike\{PikeException};

final class OverwritePageBlocksTest extends PagesControllerTestCase {
    public function testOverwritePageBlocksSavesNewBlocksToDb(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
        $this->insertTestPageDataToDb($state);
        $this->sendOverwritePageBlocksRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyOverwrotePageBlocksToDb($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $btu = new BlockTestUtils();
        $state->testPageData = $this->pageTestUtils->makeTestPageData();
        $state->testPageData->slug = "/overwrite-blocks-test-page";
        $state->testPageData->path = "/overwrite-blocks-test-page/";
        $state->inputData = (object) ["blocks" =>
            [$btu->makeBlockData(Block::TYPE_PARAGRAPH, propsData: ["text" => "Hello", "cssClass" => ""])]
        ];
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    private function sendOverwritePageBlocksRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest($this->createApiRequest(
            "/api/pages/" . PageType::PAGE . "/{$state->testPageData->id}/blocks",
            "PUT",
            $state->inputData));
    }
    private function verifyOverwrotePageBlocksToDb(\TestState $state): void {
        $actual = $this->pageTestUtils->getPageById($state->testPageData->id);
        $this->assertCount(1, $actual->blocks);
        $this->assertEmpty($actual->blocks[0]->children);
        $this->assertEquals($state->inputData->blocks[0]->type, $actual->blocks[0]->type);
        $this->assertEquals($state->inputData->blocks[0]->id, $actual->blocks[0]->id);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testOverwritePageBlocksRejectsInvalidInputs(): void {
        $state = $this->setupTest();
        $state->inputData = (object) ["blocks" => [(object) ["type" => "not-valid", "cssClass" => ""]]];
        $this->makeTestSivujettiApp($state);
        $this->insertTestPageDataToDb($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage("Unknown block type `not-valid`");
        $this->sendOverwritePageBlocksRequest($state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testOverwritePageBlocksRejectsInvalidInputs2(): void {
        $state = $this->setupTest();
        $state->inputData = (object) ["blocks" => [(object) ["type" => "Paragraph", "id" => "not-valid"]]];
        $this->makeTestSivujettiApp($state);
        $this->insertTestPageDataToDb($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage(implode("\n", [
            "title must be string",
            "The length of title must be 1024 or less",
            "The value of renderer was not in the list",
            "id is not valid push id",
            "text must be string",
            "The length of text must be 1024 or less",
            "cssClass must be string",
            "The length of cssClass must be 1024 or less",
        ]));
        $this->sendOverwritePageBlocksRequest($state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testOverwritePageRejectsIfPageDoesNotExist(): void {
        $state = $this->setupTest();
        $state->testPageData->id = "4040";
        $this->makeTestSivujettiApp($state);
        $this->expectException(PikeException::class);
        $this->sendOverwritePageBlocksRequest($state);
    }
}
