<?php declare(strict_types=1);

namespace Sivujetti\Tests\PageBlock;

use Sivujetti\PageType\Entities\PageType;
use Sivujetti\Tests\Page\PagesControllerTestCase;
use Sivujetti\Tests\Utils\CssGenTestUtils;

final class UpsertPageBlockStylesTest extends PagesControllerTestCase {
    private CssGenTestUtils $cssGenTestUtils;
    protected function setUp(): void {
        parent::setUp();
        $this->cssGenTestUtils = new CssGenTestUtils(self::$db);
        $this->cssGenTestUtils->prepareStylesFor("test-suite-theme");
    }
    protected function tearDown(): void {
        parent::tearDown();
        $this->cssGenTestUtils->cleanUp();
    }
    public function testUpsertPageBlockBlocksUpdatesStyles(): void {
        $state = $this->setupTest();
        $this->insertTestPageDataToDb($state);
        $this->insertTestPageBlockStylesToDb($state);
        $this->makeTestSivujettiApp($state);
        $this->sendUpsertPageBlockStylesRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyOverwroteStylesToDb($state);
        $this->verifyCachedGeneratedCssToDb($state);
        $this->verifyOverwroteGeneratedCssFile($state);
    }
    protected function setupTest(): \TestState {
        $state = new \TestState;
        $state->testTheme = (object) ["id" => "1", "name" => "test-suite-theme"];
        $state->testPageData = $this->pageTestUtils->makeTestPageData();
        $state->originalData = $this->pageTestUtils
            ->makePageBlockStylesData($state->testPageData, $state->testTheme->id);
        $state->inputData = (object) ["styles" => json_decode($state->originalData->styles),
                                      "junk" => "junk-outer-object"];
        $state->inputData->styles[0]->styles = "[[scope]] { color: var(--updated) }";
        $state->inputData->styles[0]->junk = "junk-inner-object";
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    private function insertTestPageBlockStylesToDb(\TestState $state): void {
        $state->originalData->pageId = $state->testPageData->id;
        $data = clone $state->originalData;
        $this->dbDataHelper->insertData($data, "pageBlocksStyles");
    }
    private function sendUpsertPageBlockStylesRequest(\TestState $state): void {
        $pageTypeName = PageType::PAGE;
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/pages/{$pageTypeName}/{$state->testPageData->id}/block-styles" .
                "/{$state->testTheme->id}", "PUT", $state->inputData));
    }
    private function verifyOverwroteStylesToDb(\TestState $state): void {
        $actual = $this->dbDataHelper->getRow("pageBlocksStyles",
                                              "`pageId` = ? AND `pageTypeName` = ?",
                                              [$state->testPageData->id,
                                               PageType::PAGE]);
        //
        $removeJunk = fn(object $input) => (object) [
            "blockId" => $input->blockId,
            "styles" => $input->styles,
        ];
        $this->assertEquals(array_map($removeJunk, $state->inputData->styles),
                            json_decode($actual["styles"]));
    }
    private function verifyCachedGeneratedCssToDb(\TestState $state): void {
        $row = $this->dbDataHelper->getRow("themes", "id=?", [$state->testTheme->id]);
        $expected = $this->cssGenTestUtils->generateCachedBlockStyles($state->inputData->styles);
        $this->assertEquals($expected, $row["generatedBlockCss"]);
    }
    private function verifyOverwroteGeneratedCssFile(\TestState $state): void {
        $expectedBlockStylePart = $this->cssGenTestUtils->generateCachedBlockStyles($state->inputData->styles);
        $actual = $this->cssGenTestUtils->getActualGeneratedCss();
        $expected = $this->cssGenTestUtils->generateExpectedGeneratedCssContent(expectedBlockStyles: $expectedBlockStylePart);
        $this->assertEquals($expected, $actual);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpsertPageBlockBlocksInsertsStylesIfNotYetCreated(): void {
        $state = $this->setupTest();
        $this->insertTestPageDataToDb($state);
        $this->makeTestSivujettiApp($state);
        $this->sendUpsertPageBlockStylesRequest($state);
        $this->verifyRequestFinishedSuccesfully($state, 201);
        $this->verifyInsertedStylesToDb($state);
    }
    private function verifyInsertedStylesToDb(\TestState $state): void {
        $this->verifyOverwroteStylesToDb($state);
        $this->verifyCachedGeneratedCssToDb($state);
        $this->verifyOverwroteGeneratedCssFile($state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpsertPageBlockRejectsInvalidInput(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
        $this->insertTestPageDataToDb($state);
        //
        $state->inputData = (object) [];
        $this->sendUpsertPageBlockStylesRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals(["Expected \$input->styles to be an array"], $state->spyingResponse);
        //
        $state->inputData = (object) ["styles" => ""];
        $this->sendUpsertPageBlockStylesRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals(["Expected \$input->styles to be an array"], $state->spyingResponse);
        //
        $state->inputData = (object) ["styles" => [""]];
        $this->sendUpsertPageBlockStylesRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals(["Expected \$input->styles[0] to be an object"], $state->spyingResponse);
        //
        $state->inputData = (object) ["styles" => [(object) ["junk" => "foo"]]];
        $this->sendUpsertPageBlockStylesRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals(["Expected \$input->styles[0]->styles to be a string"], $state->spyingResponse);
        //
        $state->inputData = (object) ["styles" => [(object) ["styles" => "not valid css %€&/="]]];
        $this->sendUpsertPageBlockStylesRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "styles.0.styles is not valid CSS",
            "The length of styles.0.blockId must be at least 20",
        ], $state->spyingResponse);
    }
}
