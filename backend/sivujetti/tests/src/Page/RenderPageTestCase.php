<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use Pike\Request;
use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\SharedAPIContext;
use Sivujetti\Tests\Utils\{DbDataHelper, HttpApiTestTrait, PageTestUtils,
                           TestEnvBootstrapper};

abstract class RenderPageTestCase extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    protected PageTestUtils $pageTestUtils;
    protected SharedAPIContext $testApiCtx;
    protected DbDataHelper $dbDataHelper;
    protected function setUp(): void {
        parent::setUp();
        $this->testApiCtx = new SharedAPIContext;
        $this->pageTestUtils = new PageTestUtils(self::$db, $this->testApiCtx);
        $this->dbDataHelper = new DbDataHelper(self::$db);
    }
    public static function getDbConfig(): array {
        return require TEST_CONFIG_FILE_PATH;
    }
    public function makeRenderPageTestApp(\TestState $state): void {
        $this->makeTestSivujettiApp($state, function (TestEnvBootstrapper $bootModule) {
            $bootModule->useMock("apiCtx", [$this->testApiCtx]);
        });
    }
    protected function insertTestPageToDb(\TestState $state): void {
        $this->pageTestUtils->insertPage($state->testPageData);
    }
    protected function sendRenderPageRequest(\TestState $state, bool $inEditMode = false): void {
        $state->spyingResponse = $state->app->sendRequest(
            new Request($state->testPageData->slug, "GET",
                body: null,
                files: null,
                serverVars: ["HTTP_HOST" => "localhost"],
                queryVars: !$inEditMode ? null : ["in-edit" => ""]
            ));
    }
    protected function verifyRequestFinishedSuccesfully(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "text/html", $state->spyingResponse);
    }
}
