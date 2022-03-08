<?php declare(strict_types=1);

namespace Sivujetti\Tests\Theme;

use Sivujetti\App;

final class GetThemeStylesTest extends ThemesControllerTestCase {
    public function testListStylesReturnsListOfThemesStyles(): void {
        $state = parent::createDefaultTestState();
        $this->insertTestTheme($state);
        $this->sendListThemeStylesRequest($state);
        $this->verifyReturnedThemesStylesFromDb($state);
    }
    private function sendListThemeStylesRequest(\TestState $state): void {
        $app = $this->makeApp(fn() => App::create(self::setGetConfig()));
        $state->spyingResponse = $app->sendRequest(
            $this->createApiRequest("/api/themes/{$state->testThemeId}/styles", "GET"));
    }
    private function verifyReturnedThemesStylesFromDb(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
        $actualStyles = json_decode($state->spyingResponse->getActualBody(), flags: JSON_THROW_ON_ERROR);
        $this->assertCount(2, $actualStyles);
        $this->assertEquals("textColor", $actualStyles[0]->name);
        $this->assertEquals("ff0000ff", implode("", $actualStyles[0]->value->value));
        $this->assertEquals("headerColor", $actualStyles[1]->name);
        $this->assertEquals("00ff00ff", implode("", $actualStyles[1]->value->value));
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
