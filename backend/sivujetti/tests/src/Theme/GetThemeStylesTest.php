<?php declare(strict_types=1);

namespace Sivujetti\Tests\Theme;

final class GetThemeStylesTest extends ThemesControllerTestCase {
    public function testListStylesReturnsListOfThemesStyles(): void {
        $state = parent::createDefaultTestState();
        $this->insertTestTheme($state);
        $this->insertTestBlockTypeStylesForTestTheme($state);
        $this->sendListThemeStylesRequest($state);
        $this->verifyReturnedThemesStylesFromDb($state);
    }
    private function sendListThemeStylesRequest(\TestState $state): void {
        $this->makeTestSivujettiApp($state);
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/themes/{$state->testThemeId}/styles", "GET"));
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
        $state->testThemeId = "999";
        $this->sendListThemeStylesRequest($state);
        $this->verifyReturnedNothingFromDb($state);
    }
    private function verifyReturnedNothingFromDb(\TestState $state): void {
        $this->verifyResponseMetaEquals(404, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([], $state->spyingResponse);
    }
}
