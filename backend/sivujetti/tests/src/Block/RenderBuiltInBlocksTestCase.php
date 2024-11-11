<?php declare(strict_types=1);

namespace Sivujetti\Tests\Block;

use Sivujetti\JsonUtils;

abstract class RenderBuiltInBlocksTestCase extends RenderBlocksTestCase {
    protected function renderAndVerify(\TestState $state, int $testBlockIdx, string $expectedHtml): void {
        $block = $state->testBlocks[$testBlockIdx];
        $this->sendRenderBlockRequest($state, $block);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyResponseBodyEquals(JsonUtils::stringify((object) ["result" => $expectedHtml]),
                                        $state->spyingResponse);
    }
}
