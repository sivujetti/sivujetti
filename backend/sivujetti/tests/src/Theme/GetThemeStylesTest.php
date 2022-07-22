<?php declare(strict_types=1);

namespace Sivujetti\Tests\Theme;

final class GetThemeStylesTest extends ThemesControllerTestCase {
    public function testListStylesReturnsAllStyles(): void {
        $state = parent::createDefaultTestState();
        $this->insertTestTheme($state, "get-styles-test-theme");
        $this->insertTestStylesForTestTheme($state);
        $this->insertTestBlockTypeStylesForTestTheme($state);
        $this->sendListThemeStylesRequest($state);
        $this->verifyReturnedThemesStylesFromDb($state);
    }
    private function sendListThemeStylesRequest(\TestState $state): void {
        $this->makeTestSivujettiApp($state);
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/themes/{$state->testTheme->id}/styles", "GET"));
    }
    private function verifyReturnedThemesStylesFromDb(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
        $resp = json_decode($state->spyingResponse->getActualBody(), flags: JSON_THROW_ON_ERROR);
        $actualGlobalStyles = $resp->globalStyles;
        $this->assertCount(2, $actualGlobalStyles);
        $this->assertEquals("textColor", $actualGlobalStyles[0]->name);
        $this->assertEquals("ff0000ff", implode("", $actualGlobalStyles[0]->value->value));
        $this->assertEquals("headerColor", $actualGlobalStyles[1]->name);
        $this->assertEquals("00ff00ff", implode("", $actualGlobalStyles[1]->value->value));
        //
        $expectedStyles = $state->testStyles;
        $actualStyles = $resp->styles;
        $this->assertCount(2, $actualStyles);
        usort($actualStyles, fn($a, $b) => $b->blockTypeName <=> $a->blockTypeName);
        $this->assertEquals($expectedStyles[0]->blockTypeName, $actualStyles[0]->blockTypeName);
        $this->assertEquals($expectedStyles[0]->units, json_encode($actualStyles[0]->units));
        $this->assertEquals($expectedStyles[1]->blockTypeName, $actualStyles[1]->blockTypeName);
        $this->assertEquals($expectedStyles[1]->units, json_encode($actualStyles[1]->units));
        //
        $expectedBlockTypeStyles = $state->testBlockTypeStyles;
        $actualBlockTypeStyles = $resp->blockTypeStyles;
        $this->assertCount(2, $actualBlockTypeStyles);
        usort($actualBlockTypeStyles, fn($a, $b) => $b->blockTypeName <=> $a->blockTypeName);
        $this->assertEquals($expectedBlockTypeStyles[0]->blockTypeName, $actualBlockTypeStyles[0]->blockTypeName);
        $this->assertEquals($expectedBlockTypeStyles[0]->styles, $actualBlockTypeStyles[0]->styles);
        $this->assertEquals($expectedBlockTypeStyles[1]->blockTypeName, $actualBlockTypeStyles[1]->blockTypeName);
        $this->assertEquals($expectedBlockTypeStyles[1]->styles, $actualBlockTypeStyles[1]->styles);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testListStylesReturnsNothingIfThemeDoesNotExist(): void {
        $state = parent::createDefaultTestState();
        $state->testTheme = (object) ["id" => "999"];
        $this->sendListThemeStylesRequest($state);
        $this->verifyReturnedNothingFromDb($state);
    }
    private function verifyReturnedNothingFromDb(\TestState $state): void {
        $this->verifyResponseMetaEquals(404, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([], $state->spyingResponse);
    }
}
