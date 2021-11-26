<?php declare(strict_types=1);

namespace Sivujetti\Tests\Block;

use Sivujetti\App;
use Sivujetti\Tests\Utils\{BlockTestUtils, HttpApiTestTrait, PageTestUtils};
use Pike\TestUtils\{DbTestCase, HttpTestUtils};

abstract class RenderBlocksTestCase extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    protected BlockTestUtils $blockTestUtils;
    protected PageTestUtils $pageTestUtils;
    protected function setUp(): void {
        parent::setUp();
        $this->pageTestUtils = new PageTestUtils(self::$db);
        $this->blockTestUtils = new BlockTestUtils($this->pageTestUtils);
    }
    protected function setupTest(): \TestState {
        $state = new \TestState;
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    protected function makeTestSivujettiApp(\TestState $state): void {
        $state->app = $this->makeApp(fn() => App::create(self::setGetConfig()));
    }
    protected function sendRenderBlockRequest(\TestState $state, ?object $block = null): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/blocks/render",
                "POST", (object) ["block" => $block ?? $state->testBlock]));
    }
    protected function verifyRequestFinishedSuccesfully(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
    }
}
