<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use Sivujetti\{App, AppContext, SharedAPIContext};
use Sivujetti\Page\WebPageAwareTemplate;
use Sivujetti\UserSite\UserSiteAPI;
use Pike\{Request, TestUtils\DbTestCase, TestUtils\HttpTestUtils};

final class RenderEditAppWrapperTest extends DbTestCase {
    use HttpTestUtils;
    public function testRenderEditAppWrapperIncludesUserDefinedJsFiles(): void {
        $state = $this->setupTest();
        $this->registerJsFile("some-file.js", $state);
        $this->makeTestSivujettiApp($state);
        $this->sendRenderEditAppWrapperRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyInlcudedUserDefinedJsFiles($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->apiCtx = new SharedAPIContext;
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    private function registerJsFile(string $url, \TestState $state): void {
        $api = new UserSiteAPI("site", $state->apiCtx);
        $api->enqueueEditAppJsFile($url);
    }
    private function makeTestSivujettiApp(\TestState $state): void {
        $ctx = new AppContext;
        $ctx->apiCtx = $state->apiCtx;
        $state->app = $this->makeApp(fn() => App::create(self::setGetConfig(), $ctx));
    }
    private function sendRenderEditAppWrapperRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            new Request("/_edit", "GET"));
    }
    private function verifyRequestFinishedSuccesfully(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "text/html", $state->spyingResponse);
    }
    private function verifyInlcudedUserDefinedJsFiles(\TestState $state): void {
        $expectedUrl = WebPageAwareTemplate::makeUrl("/public/some-file.js");
        $this->assertStringContainsString("<script src=\"{$expectedUrl}\"></script>",
            $state->spyingResponse->getActualBody());
    }
}
