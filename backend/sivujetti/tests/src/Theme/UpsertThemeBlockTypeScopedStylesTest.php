<?php declare(strict_types=1);

namespace Sivujetti\Tests\Theme;

use Sivujetti\Tests\Utils\CssGenTestUtils;

final class UpsertThemeBlockTypeScopedStylesTest extends ThemesControllerTestCase {
    private CssGenTestUtils $cssGenTestUtils;
    protected function setUp(): void {
        parent::setUp();
        $this->cssGenTestUtils = new CssGenTestUtils(self::$db);
        $this->cssGenTestUtils->prepareStylesFor("overwrite-theme-styles-test-theme1");
    }
    protected function tearDown(): void {
        parent::tearDown();
        $this->cssGenTestUtils->cleanUp();
    }
    public function testUpsertBlockTypeScopedStylesOverwritesThemesStyles(): void {
        $state = $this->setupTest();
        $this->insertTestTheme($state, "overwrite-theme-styles-test-theme1");
        $this->insertTestStylesForTestTheme($state);
        $this->sendUpsertBlockTypeScopedStylesRequest($state);
        $this->verifyUpdatedThemeBlockTypeScopedStylesToDb($state);
        $this->verifyUpdatedCachedGeneratedScopedCssToDb($state);
        $this->verifyOverwroteGeneratedCssFile($state);
    }
    private function setupTest(): \TestState {
        $state = parent::createDefaultTestState();
        $origSectionUnits = json_decode($state->testStyles[0]->units, associative: true);
        $updatedSectionUnit = ["scss" => "color: red", "generatedCss" => ".j-Section-default{color:red;}", "junk" => "foo"];
        $state->testInput = (object) ["units" => [(object) array_merge($origSectionUnits[0], $updatedSectionUnit)]];
        return $state;
    }
    private function sendUpsertBlockTypeScopedStylesRequest(\TestState $state,
                                                            string $blockTypeName = "Section"): void {
        $this->makeTestSivujettiApp($state);
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/themes/{$state->testTheme->id}/styles/scope-block-type/{$blockTypeName}",
                                    "PUT",
                                    $state->testInput));
    }
    private function verifyUpdatedThemeBlockTypeScopedStylesToDb(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
        $row = $this->dbDataHelper->getRow("themeStyles",
                                           "themeId=? AND blockTypeName=?",
                                           [$state->testTheme->id, "Section"]);
        $actualUnits = json_decode($row["units"]);
        $removeJunk = fn(object $input) => (object) [
            "title" => $input->title,
            "scss" => $input->scss,
            "generatedCss" => $input->generatedCss,
        ];
        $this->assertEquals([$removeJunk($state->testInput->units[0])], $actualUnits);
    }
    private function verifyUpdatedCachedGeneratedScopedCssToDb(\TestState $state): void {
        $row = $this->dbDataHelper->getRow("themes",
                                           "id=?",
                                           [$state->testTheme->id]);
        $expected = $this->getUpdatedScopedStyles($state->testStyles, $state->testInput);
        $asString = CssGenTestUtils::generateScopedStyles($expected);
        $this->assertEquals($asString, $row["generatedScopedStylesCss"]);
    }
    private function verifyOverwroteGeneratedCssFile(\TestState $state): void {
        $expected = $this->getUpdatedScopedStyles($state->testStyles, $state->testInput);
        $asString = CssGenTestUtils::generateScopedStyles($expected);
        $actual = $this->cssGenTestUtils->getActualGeneratedCss();
        $this->assertEquals($asString, $actual);
    }
    // [{units: <original>, blockTypeName: "Section", themeId: "1"}, ...] -> [{units: <updated>, blockTypeName: "Section", themeId: "1"}, ...]
    private function getUpdatedScopedStyles(array $testStyles, object $testInput): array {
        $all = json_decode(json_encode($testStyles));
        $sectionStylesUnits = json_decode($all[0]->units);
        $sectionStylesUnits[0]->scss = $testInput->units[0]->scss;
        $sectionStylesUnits[0]->generatedCss = $testInput->units[0]->generatedCss;
        $all[0]->units = json_encode($sectionStylesUnits);
        return $all;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpsertBlockTypeScopedStylesInsertsStylesIfNotYetCreated(): void {
        $this->assertTrue(false);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpsertBlockTypeScopedStylesRejectsInvalidInputs(): void {
        $this->assertTrue(false);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpsertBlockTypeScopedStylesThrowsIfBlockTypeNameIsNotRecognized(): void {
        $this->assertTrue(false);
    }
}
