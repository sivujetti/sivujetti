<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use Pike\Request;
use Pike\TestUtils\HttpTestUtils;
use Sivujetti\Page\WebPageAwareTemplate;
use Sivujetti\UserSite\UserSiteAPI;

final class RenderEditAppWrapperTest extends RenderPageTestCase {
    use HttpTestUtils;
    public function testRenderEditAppWrapperIncludesUserDefinedJsFiles(): void {
        $state = $this->setupTest();
        $this->registerJsFile("some-file.js", $state);
        $this->makePagesControllerTestApp($state);
        $this->sendRenderEditAppWrapperRequest($state);
        $this->verifyRequestFinishedSuccesfully($state, withContentType: "text/html");
        $this->verifyInlcudedUserDefinedJsFiles($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    private function registerJsFile(string $url, \TestState $state): void {
        $mutRef = $this->testApiCtx;
        $api = new UserSiteAPI("site", $mutRef);
        $api->enqueueEditAppJsFile($url);
    }
    private function sendRenderEditAppWrapperRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            new Request("/_edit", "GET"));
    }
    private function verifyInlcudedUserDefinedJsFiles(\TestState $state): void {
        $expectedUrl = (new WebPageAwareTemplate("dummy"))->makeUrl("/public/some-file.js", false);
        $this->assertStringContainsString("<script src=\"{$expectedUrl}?v=abcdefg1\"></script>",
            $state->spyingResponse->getActualBody());
    }
}
