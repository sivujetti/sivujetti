<?php declare(strict_types=1);

namespace Sivujetti\Tests\Theme;

final class OverwriteThemeGlobalStylesTest extends ThemesControllerTestCase {
    public function testUpdateGlobalStylesOverwritesThemesStyles(): void {
        $state = $this->setupTest();
        $this->insertTestTheme($state, "overwrite-theme-styles-test-theme");
        $this->sendUpdateThemeGlobalStylesRequest($state);
        $this->verifyUpdatedThemesStylesToDb($state);
    }
    private function setupTest(): \TestState {
        $state = parent::createDefaultTestState();
        $state->testInput = (object) ["allStyles" => [
            (object)["name"=>"textColor","friendlyName"=>"updated 1",
                     "value"=>(object)["type"=>"color","value"=>["00","00","ff","ff"]]],
            (object)["name"=>"headerColor","friendlyName"=>"updated 2",
                     "value"=>(object)["type"=>"color","value"=>["ff","00","00","cc"]]],
        ]];
        return $state;
    }
    private function sendUpdateThemeGlobalStylesRequest(\TestState $state): void {
        $this->makeTestSivujettiApp($state);
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/themes/{$state->testTheme->id}/styles/global",
                                    "PUT",
                                    $state->testInput));
    }
    private function verifyUpdatedThemesStylesToDb(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
        $theme = $this->dbDataHelper->getRow("themes", "id=?", [$state->testTheme->id]);
        $actualStyles = json_decode($theme["globalStyles"], flags: JSON_THROW_ON_ERROR);
        $inputStyles = $state->testInput->allStyles;
        $this->assertCount(2, $actualStyles);
        $this->assertEquals((array)$inputStyles[0], (array)$actualStyles[0]);
        $this->assertEquals((array)$inputStyles[1], (array)$actualStyles[1]);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdateGlobalStylesRejectsInvalidInputs(): void {
        $state = $this->setupTest();
        $state->testTheme = (object) ["id" => "1"];
        $state->testInput->allStyles = [];
        $this->sendUpdateThemeGlobalStylesRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals(["The length of allStyles must be at least 1"], $state->spyingResponse);

        $state->testInput->allStyles = [
            (object) [
                // omit name
                // omit friendlyName
                "value" => (object) [
                    "type" => "unknown",
                    "value" => ["not-hex", "not-hex", "not-hex", "not-hex"]
                ]
            ]
        ];
        $this->sendUpdateThemeGlobalStylesRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "allStyles.0.name must contain only [a-zA-Z0-9_] and start with [a-zA-Z_]",
            "The length of allStyles.0.name must be 1024 or less",
            "The length of allStyles.0.friendlyName must be 1024 or less",
            "The value of allStyles.0.value.type was not in the list",
            "The length of allStyles.0.value.value.0 must be 2 or less",
            "The length of allStyles.0.value.value.1 must be 2 or less",
            "The length of allStyles.0.value.value.2 must be 2 or less",
            "The length of allStyles.0.value.value.3 must be 2 or less",
            "allStyles.0.value.value.0 must be xdigit string",
            "allStyles.0.value.value.1 must be xdigit string",
            "allStyles.0.value.value.2 must be xdigit string",
            "allStyles.0.value.value.3 must be xdigit string",
        ], $state->spyingResponse);
    }
    

    ////////////////////////////////////////////////////////////////////////////


    public function testListStylesReturnsNothingIfThemeDoesNotExist(): void {
        $state = $this->setupTest();
        $state->testTheme = (object) ["id" => "999"];
        $this->sendUpdateThemeGlobalStylesRequest($state);
        $this->verifyResponseMetaEquals(404, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals(["ok" => "err"], $state->spyingResponse);
    }
}
