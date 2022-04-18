<?php declare(strict_types=1);

namespace Sivujetti\Tests\Theme;

use Sivujetti\Tests\Utils\CssGenTestUtils;

final class OverwriteThemeBlockTypeStylesTest extends ThemesControllerTestCase {
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
    public function testUpdateBlockTypeStylesOverwritesThemesStyles(): void {
        $state = $this->setupTest();
        $this->insertTestTheme($state, "overwrite-theme-styles-test-theme");
        $this->insertTestBlockTypeStylesForTestTheme($state);
        $this->sendUpdateBlockTypeStylesRequest($state);
        $this->verifyUpdatedThemeBlockTypeStylesStylesToDb($state);
        $this->verifyCachedGeneratedCssToDb($state);
        $this->verifyOverwroteGeneratedCssFile($state);
    }
    private function setupTest(): \TestState {
        $state = parent::createDefaultTestState();
        $state->testInput = (object) ["styles" => "[[scope]] { color: salmon; }"];
        return $state;
    }
    private function sendUpdateBlockTypeStylesRequest(\TestState $state): void {
        $this->makeTestSivujettiApp($state);
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/themes/{$state->testTheme->id}/styles/block-type/Section",
                                    "PUT",
                                    $state->testInput));
        $state->testBlockTypeStyles[0]->styles = $state->testInput->styles;
    }
    private function verifyUpdatedThemeBlockTypeStylesStylesToDb(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
        $row = $this->dbDataHelper->getRow("themeBlockTypeStyles",
                                           "themeId=? AND blockTypeName=?",
                                           [$state->testTheme->id, "Section"]);
        $actualStyles = $row["styles"];
        $this->assertEquals($state->testInput->styles, $actualStyles);
    }
    private function verifyCachedGeneratedCssToDb(\TestState $state): void {
        $row = $this->dbDataHelper->getRow("themes",
                                           "id=?",
                                           [$state->testTheme->id]);
        $expected = $this->cssGenTestUtils->generateCachedBlockTypeBaseStyles($state->testBlockTypeStyles);
        $this->assertEquals($expected, $row["generatedBlockTypeBaseCss"]);
    }
    private function verifyOverwroteGeneratedCssFile(\TestState $state): void {
        $expectedBlockTypeBaseStylesPart = $this->cssGenTestUtils
            ->generateCachedBlockTypeBaseStyles($state->testBlockTypeStyles);
        $actual = $this->cssGenTestUtils->getActualGeneratedCss();
        $expected = $this->cssGenTestUtils
            ->generateExpectedGeneratedCssContent(expectedBlockTypeBaseStyles: $expectedBlockTypeBaseStylesPart);
        $this->assertEquals($expected, $actual);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdateBlockTypeStylesRejectsInvalidInputs(): void {
        $state = $this->setupTest();
        $state->testTheme = (object) ["id" => "1"];
        $state->testInput->styles = ["not-a-string"];
        $this->sendUpdateBlockTypeStylesRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "Expected \$input->styles to be a string",
        ], $state->spyingResponse);
    }
}
