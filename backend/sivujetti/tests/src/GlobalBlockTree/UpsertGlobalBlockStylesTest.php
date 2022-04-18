<?php declare(strict_types=1);

namespace Sivujetti\Tests\GlobalBlockTree;

use Sivujetti\Tests\Utils\CssGenTestUtils;

final class UpsertGlobalBlockStylesTest extends GlobalBlockTreesControllerTestCase {
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
    public function testUpsertGlobalBlockTreeBlocksUpdatesStyles(): void {
        $state = $this->setupTest();
        $this->insertTestGlobalBlockTreeToDb($state, $state->testGlobalBlockTreeData);
        $this->insertTestGlobalBlockStylesToDb($state);
        $this->makeTestSivujettiApp($state);
        $this->sendUpsertGlobalBlockStylesRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyOverwroteStylesToDb($state);
        $this->verifyCachedGeneratedCssToDb($state);
        $this->verifyOverwroteGeneratedCssFile($state);
    }
    protected function setupTest(): \TestState {
        $state = new \TestState;
        $state->testTheme = (object) ["id" => "1", "name" => "test-suite-theme"];
        $state->testGlobalBlockTreeData = $this->globalBlockTreeTestUtils->makeGlobalBlockTreeData();
        $state->originalData = $this->globalBlockTreeTestUtils->makeGlobalBlockStylesData($state->testGlobalBlockTreeData,
            $state->testTheme->id);
        $state->inputData = (object) ["styles" => json_decode($state->originalData->styles),
                                      "junk" => "junk-data-root"];
        $state->inputData->styles[0]->styles = "[[scope]] { color: var(--updated) }";
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
        $parsed = json_decode($state->originalData->styles);
        $this->cssGenTestUtils->getCssGenCache()->updateBlocksCss(
            $this->cssGenTestUtils->generateCachedBlockStyles($parsed),
            $state->testTheme->name);
    }
    private function sendUpsertGlobalBlockStylesRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/global-block-trees/{$state->testGlobalBlockTreeData->id}/block-styles" .
                "/{$state->testTheme->id}", "PUT", $state->inputData));
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
        $this->verifyCachedGeneratedCssToDb($state);
        $this->verifyOverwroteGeneratedCssFile($state);
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
        $state->inputData = (object) ["styles" => [(object) ["styles" => "/* css */"]]];
        $this->sendUpsertGlobalBlockStylesRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "The length of styles.0.blockId must be at least 20",
        ], $state->spyingResponse);
    }
}
