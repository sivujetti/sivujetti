<?php declare(strict_types=1);

namespace Sivujetti\Tests\Auth;

final class LoginTest extends AuthControllerTestCase {
    public function testDoLoginRejectsEmptyInput(): void {
        $state = $this->setupLoginTest();
        $this->makeTestSivujettiApp($state);
        $this->sendLoginRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals(["The length of username must be at least 2",
                                         "The length of password must be at least 1"],
                                        $state->spyingResponse);
    }
    protected function setupLoginTest(): \TestState {
        $state = parent::setupTest();
        $state->testInput = (object) [];
        return $state;
    }
    private function sendLoginRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/auth/login", "POST", $state->testInput));
    }
}
