<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use Sivujetti\App;
use Sivujetti\AppContext;
use Sivujetti\SharedAPIContext;
use Sivujetti\Tests\Utils\PageTestUtils;
use Pike\Request;
use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\Tests\Utils\DbDataHelper;

abstract class RenderPageTestCase extends DbTestCase {
    use HttpTestUtils;
    protected PageTestUtils $pageTestUtils;
    protected SharedAPIContext $testAppStorage;
    protected DbDataHelper $dbDataHelper;
    protected function setUp(): void {
        parent::setUp();
        $this->testAppStorage = new SharedAPIContext;
        $this->pageTestUtils = new PageTestUtils(self::$db, $this->testAppStorage);
        if (!file_exists(SIVUJETTI_BACKEND_PATH . "site/templates/layout.default.tmpl.php"))
            throw new \RuntimeException("Site not installed");
        $this->dbDataHelper = new DbDataHelper(self::$db);
    }
    protected function makeSivujettiApp(\TestState $state): void {
        $ctx = new AppContext;
        $ctx->storage = $this->testAppStorage;
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
