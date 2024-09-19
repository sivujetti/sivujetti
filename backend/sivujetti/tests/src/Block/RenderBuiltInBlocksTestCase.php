<?php declare(strict_types=1);

namespace Sivujetti\Tests\Block;

use Sivujetti\Template;

abstract class RenderBuiltInBlocksTestCase extends RenderBlocksTestCase {
    protected function renderAndVerify(\TestState $state, int $testBlockIdx, string $expectedHtml): void {
        $block = $state->testBlocks[$testBlockIdx];
        $this->sendRenderBlockRequest($state, $block);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyResponseBodyEquals(json_encode((object) ["result" => $expectedHtml], JSON_UNESCAPED_UNICODE),
                                        $state->spyingResponse);
    }
    protected static function createTemplate(): Template {
        return new Template("dummy", env: (require TEST_CONFIG_FILE_PATH)["env"]);
    }
}
