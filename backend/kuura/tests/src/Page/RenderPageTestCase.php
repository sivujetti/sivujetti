<?php declare(strict_types=1);

namespace KuuraCms\Tests\Page;

use KuuraCms\App;
use KuuraCms\AppContext;
use KuuraCms\SharedAPIContext;
use KuuraCms\Tests\Utils\PageTestUtils;
use Pike\{Request, TestUtils\DbTestCase, TestUtils\HttpTestUtils};

abstract class RenderPageTestCase extends DbTestCase {
    use HttpTestUtils;
    protected PageTestUtils $pageTestUtils;
    protected SharedAPIContext $testAppStorage;
    protected function setUp(): void {
        parent::setUp();
        $this->testAppStorage = new SharedAPIContext;
        $this->pageTestUtils = new PageTestUtils(self::$db, $this->testAppStorage);
        if (!file_exists(KUURA_BACKEND_PATH . "site/templates/layout.default.tmpl.php"))
            throw new \RuntimeException("Site not installed");
    }
    protected function makeKuuraApp(\TestState $state): void {
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
