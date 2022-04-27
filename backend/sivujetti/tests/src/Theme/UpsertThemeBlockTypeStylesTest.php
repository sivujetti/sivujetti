<?php declare(strict_types=1);

namespace Sivujetti\Tests\Theme;

use Pike\{ArrayUtils, PikeException};
use Sivujetti\Tests\Utils\CssGenTestUtils;

final class UpsertThemeBlockTypeStylesTest extends ThemesControllerTestCase {
    private CssGenTestUtils $cssGenTestUtils;
    protected function setUp(): void {
        parent::setUp();
        $this->cssGenTestUtils = new CssGenTestUtils(self::$db);
        $this->cssGenTestUtils->prepareStylesFor("overwrite-theme-styles-test-theme");
    }
    protected function tearDown(): void {
        parent::tearDown();
        $this->cssGenTestUtils->cleanUp();
    }
    public function testUpsertBlockTypeStylesOverwritesThemesStyles(): void {
        $state = $this->setupTest();
        $this->insertTestTheme($state, "overwrite-theme-styles-test-theme");
        $this->insertTestBlockTypeStylesForTestTheme($state);
        $this->sendUpsertBlockTypeStylesRequest($state);
        $this->verifyUpdatedThemeBlockTypeStylesStylesToDb($state);
        $this->verifyCachedGeneratedCssToDb($state);
        $this->verifyOverwroteGeneratedCssFile($state);
    }
    private function setupTest(): \TestState {
        $state = parent::createDefaultTestState();
        $state->testInput = (object) ["styles" => "[[scope]] { color: salmon; }"];
        $state->testBlockTypeStylesAfterUpsert = null;
        return $state;
    }
    private function sendUpsertBlockTypeStylesRequest(\TestState $state,
                                                      string $blockTypeName = "Section"): void {
        $this->makeTestSivujettiApp($state);
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/themes/{$state->testTheme->id}/styles/block-type/{$blockTypeName}",
                                    "PUT",
                                    $state->testInput));
    }
    private function verifyThemeBlockTypeStylesInDbEquals(\TestState $state,
                                                          string $expected): void {
        $row = $this->dbDataHelper->getRow("themeBlockTypeStyles",
                                           "themeId=? AND blockTypeName=?",
                                           [$state->testTheme->id, "Section"]);
        $actualStyles = $row["styles"];
        $this->assertEquals($expected, $actualStyles);
    }
    private function verifyUpdatedThemeBlockTypeStylesStylesToDb(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
        $this->verifyThemeBlockTypeStylesInDbEquals($state, $state->testInput->styles);
    }
    private function verifyCachedGeneratedCssToDb(\TestState $state): void {
        if (!$state->testBlockTypeStylesAfterUpsert) {
            $state->testBlockTypeStylesAfterUpsert = json_decode(json_encode($state->testBlockTypeStyles));
            $idx = ArrayUtils::findIndexByKey($state->testBlockTypeStylesAfterUpsert, "Section", "blockTypeName");
            $state->testBlockTypeStylesAfterUpsert[$idx]->styles = $state->testInput->styles;
        }
        $row = $this->dbDataHelper->getRow("themes",
                                           "id=?",
                                           [$state->testTheme->id]);
        $expected = $this->cssGenTestUtils->generateCachedBlockTypeBaseStyles($state->testBlockTypeStylesAfterUpsert);
        $this->assertEquals($expected, $row["generatedBlockTypeBaseCss"]);
    }
    private function verifyOverwroteGeneratedCssFile(\TestState $state): void {
        $expectedBlockTypeBaseStylesPart = $this->cssGenTestUtils
            ->generateCachedBlockTypeBaseStyles($state->testBlockTypeStylesAfterUpsert);
        $actual = $this->cssGenTestUtils->getActualGeneratedCss(ignore: "none");
        $expected = $this->cssGenTestUtils
            ->generateExpectedGeneratedCssContent(expectedBlockTypeBaseStyles: $expectedBlockTypeBaseStylesPart);
        $this->assertEquals($expected, $actual);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpsertBlockTypeStylesInsertsStylesIfNotYetCreated(): void {
        $state = $this->setupCreateNonExistingStyleTest();
        $this->insertTestTheme($state, "overwrite-theme-styles-test-theme");
        $this->insertTestBlockTypeStylesForTestTheme($state);
        $state->testBlockTypeStyles[] = (object)["styles" => $state->testInput->styles,
                                                 "themeId"=> $state->testTheme->id,
                                                 "blockTypeName" => "Section"];
        $this->sendUpsertBlockTypeStylesRequest($state);
        $this->verifyRequestFinishedSuccesfully($state, 201);
        $this->verifyInsertedStylesToDb($state);
    }
    private function setupCreateNonExistingStyleTest(): \TestState {
        $state = $this->setupTest();
        array_shift($state->testBlockTypeStyles); // Section's styles
        return $state;
    }
    private function verifyInsertedStylesToDb(\TestState $state): void {
        $this->verifyInsertedThemeBlockTypeStylesStylesToDb($state);
        $this->verifyCachedGeneratedCssToDb($state);
        $this->verifyOverwroteGeneratedCssFile($state);
    }
    private function verifyInsertedThemeBlockTypeStylesStylesToDb(\TestState $state): void {
        $this->verifyThemeBlockTypeStylesInDbEquals($state, $state->testInput->styles);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpsertBlockTypeStylesRejectsInvalidInputs(): void {
        $state = $this->setupTest();
        $state->testTheme = (object) ["id" => "1"];
        $state->testInput->styles = ["not-a-string"];
        $this->sendUpsertBlockTypeStylesRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "Expected \$input->styles to be a string",
        ], $state->spyingResponse);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpsertBlockTypeStylesThrowsIfBlockTypeNameIsNotRecognized(): void {
        $state = $this->setupTest();
        $this->insertTestTheme($state, "overwrite-theme-styles-test-theme");
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage("Unknown block type `UnknownBlockType`.");
        $this->sendUpsertBlockTypeStylesRequest($state, blockTypeName: "UnknownBlockType");
    }
}
