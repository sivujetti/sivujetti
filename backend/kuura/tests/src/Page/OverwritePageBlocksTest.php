<?php declare(strict_types=1);

namespace KuuraCms\Tests\Page;

use KuuraCms\App;
use KuuraCms\Block\Entities\Block;
use KuuraCms\PageType\Entities\PageType;
use KuuraCms\Tests\Utils\{BlockTestUtils, HttpApiTestTrait, PageTestUtils};
use Pike\{PikeException, TestUtils\DbTestCase, TestUtils\HttpTestUtils};

final class OverwritePageBlocksTest extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    private PageTestUtils $pageTestUtils;
    protected function setUp(): void {
        parent::setUp();
        $this->pageTestUtils = new PageTestUtils(self::$db);
    }
    public function testOverwritePageBlocksSavesNewBlocksToDb(): void {
        $state = $this->setupTest();
        $this->makeKuuraApp($state);
        $this->insertTestPageDataToDb($state);
        $this->sendOverwritePageBlocksRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyOverwrotePageBlocksToDb($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $btu = new BlockTestUtils();
        $state->testPageData = $this->pageTestUtils->makeTestPageData();
        $state->testPageData->slug = "/overwrite-blocks-page";
        $state->testPageData->path = "/overwrite-blocks-page/";
        $state->inputData = (object) ["blocks" =>
            [$btu->makeBlockData(Block::TYPE_PARAGRAPH, propsData: ["text" => "Hello"])]
        ];
        $state->app = null;
        return $state;
    }
    private function makeKuuraApp(\TestState $state): void {
        $state->app = $this->makeApp(fn() => App::create(self::setGetConfig()));
    }
    private function insertTestPageDataToDb(\TestState $state): void {
        $insertId = $this->pageTestUtils->insertPage($state->testPageData);
        $state->testPageData->id = $insertId;
    }
    private function sendOverwritePageBlocksRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest($this->createApiRequest(
            "/api/pages/" . PageType::PAGE . "/{$state->testPageData->id}/blocks",
            "PUT",
            $state->inputData));
    }
    private function verifyRequestFinishedSuccesfully(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
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
        $state->inputData = (object) ["blocks" => [(object) ["type" => "not-valid"]]];
        $this->makeKuuraApp($state);
        $this->insertTestPageDataToDb($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage("Unknown block type `not-valid`");
        $this->sendOverwritePageBlocksRequest($state);
    }

    ////////////////////////////////////////////////////////////////////////////

    public function testOverwritePageRejectsIfPageDoesNotExist(): void {
        $state = $this->setupTest();
        $state->testPageData->id = "4040";
        $this->makeKuuraApp($state);
        $this->expectException(PikeException::class);
        $this->sendOverwritePageBlocksRequest($state);
    }
}
