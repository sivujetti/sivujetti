<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use Sivujetti\{App, AppContext, SharedAPIContext};
use Sivujetti\Tests\Utils\{DbDataHelper, PageTestUtils};
use Pike\Request;
use Pike\TestUtils\{DbTestCase, HttpTestUtils};

abstract class RenderPageTestCase extends DbTestCase {
    use HttpTestUtils;
    protected PageTestUtils $pageTestUtils;
    protected SharedAPIContext $testApiCtx;
    protected DbDataHelper $dbDataHelper;
    protected function setUp(): void {
        parent::setUp();
        $this->testApiCtx = new SharedAPIContext;
        $this->pageTestUtils = new PageTestUtils(self::$db, $this->testApiCtx);
        $this->dbDataHelper = new DbDataHelper(self::$db);
    }
    protected function makeTestSivujettiApp(\TestState $state): void {
        $ctx = new AppContext;
        $ctx->apiCtx = $this->testApiCtx;
        $state->app = $this->makeApp(fn() => App::create(self::setGetConfig(), $ctx));
    }
    protected function insertTestPageToDb(\TestState $state): void {
        $this->pageTestUtils->insertPage($state->testPageData);
    }
    protected function sendRenderPageRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            new Request($state->testPageData->slug, "GET"));
    }
    protected function verifyRequestFinishedSuccesfully(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "text/html", $state->spyingResponse);
    }
}
