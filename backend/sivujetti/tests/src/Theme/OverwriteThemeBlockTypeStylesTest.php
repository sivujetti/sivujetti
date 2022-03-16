<?php declare(strict_types=1);

namespace Sivujetti\Tests\Theme;

use Sivujetti\App;

final class OverwriteThemeBlockTypeStylesTest extends ThemesControllerTestCase {
    public function testUpdateBlockTypeStylesOverwritesThemesStyles(): void {
        $state = $this->setupTest();
        $this->insertTestTheme($state);
        $this->insertTestBlockTypeStylesForTestTheme($state);
        $this->sendUpdateBlockTypeStylesRequest($state);
        $this->verifyUpdatedThemeBlockTypeStylesStylesToDb($state);
    }
    private function setupTest(): \TestState {
        $state = parent::createDefaultTestState();
        $state->testInput = (object) ["styles" => ".foo { color: salmon; }"];
        return $state;
    }
    private function sendUpdateBlockTypeStylesRequest(\TestState $state): void {
        $app = $this->makeApp(fn() => App::create(self::setGetConfig()));
        $state->spyingResponse = $app->sendRequest(
            $this->createApiRequest("/api/themes/{$state->testThemeId}/styles/block-type/Section",
                                    "PUT",
                                    $state->testInput));
    }
    private function verifyUpdatedThemeBlockTypeStylesStylesToDb(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
        $row = $this->dbDataHelper->getRow("themeBlockTypeStyles",
                                           "themeId=? AND blockTypeName=?",
                                           [$state->testThemeId, "Section"]);
        $actualStyles = $row["styles"];
        $this->assertEquals($state->testInput->styles, $actualStyles);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdateBlockTypeStylesRejectsInvalidInputs(): void {
        $state = $this->setupTest();
        $state->testThemeId = "1";
        $state->testInput->styles = [];
        $this->sendUpdateBlockTypeStylesRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "styles must be string",
            "The length of styles must be 512000 or less",
            "styles is not valid CSS",
        ], $state->spyingResponse);

        $state->testInput->styles = "&€% not val1d c$$";
        $this->sendUpdateBlockTypeStylesRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "styles is not valid CSS",
        ], $state->spyingResponse);
    }
    

    ////////////////////////////////////////////////////////////////////////////


    public function testListStylesReturnsNothingIfThemeDoesNotExist(): void {
        $state = $this->setupTest();
        $state->testThemeId = "999";
        $this->sendUpdateBlockTypeStylesRequest($state);
        $this->verifyResponseMetaEquals(404, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals(["ok" => "err"], $state->spyingResponse);
    }
}
