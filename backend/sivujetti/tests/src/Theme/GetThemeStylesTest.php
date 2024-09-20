<?php declare(strict_types=1);

namespace Sivujetti\Tests\Theme;

final class GetThemeStylesTest extends ThemesControllerTestCase {
    public function testListStylesReturnsAllStyles(): void {
        $state = parent::createDefaultTestState();
        $this->insertTestTheme($state, "get-styles-test-theme");
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage("todo");
        $this->sendListThemeStylesRequest($state);
    }
    private function sendListThemeStylesRequest(\TestState $state): void {
        $this->makeTestSivujettiApp($state);
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/themes/{$state->testTheme->id}/styles", "GET"));
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testListStylesReturnsNothingIfThemeDoesNotExist(): void {
        $state = parent::createDefaultTestState();
        $state->testTheme = (object) ["id" => "999"];
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage("todo");
        $this->sendListThemeStylesRequest($state);
    }
}
