<?php declare(strict_types=1);

namespace Sivujetti\Tests\Block;

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
    public static function getDbConfig(): array {
        return require TEST_CONFIG_FILE_PATH;
    }
    protected function sendRenderBlockRequest(\TestState $state, ?object $block = null): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/blocks/render",
                "POST", (object) ["block" => $block ?? $state->testBlock]));
    }
}
