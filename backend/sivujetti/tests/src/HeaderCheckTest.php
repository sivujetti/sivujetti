<?php declare(strict_types=1);

namespace Sivujetti\Tests;

use Pike\Request;
use Sivujetti\Tests\Auth\AuthControllerTestCase;

final class HeaderCheckTest extends AuthControllerTestCase {
    public function testModuleRejectsRequestsIfXRequestedWithIsMissing(): void {
        $state = parent::setupTest();
        $this->makeTestSivujettiApp($state);
        $this->sendTestRequest($state);
        $this->verifyResponseMetaEquals(400, "text/plain", $state->spyingResponse);
        $this->verifyResponseBodyEquals("X-Requested-With missing", $state->spyingResponse);
    }
    private function sendTestRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            new Request("/api/blocks/render", "POST", (object)["dum" => "my"],
                serverVars: ["CONTENT_TYPE" => "application/json"]));
    }
}
