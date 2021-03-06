<?php declare(strict_types=1);

namespace Sivujetti\Tests\Block;

abstract class RenderBuiltInBlocksTestCase extends RenderBlocksTestCase {
    protected function renderAndVerify(\TestState $state, int $testBlockIdx, string $expectedHtml): void {
        $block = $state->testBlocks[$testBlockIdx];
        $this->sendRenderBlockRequest($state, $block);
        $this->verifyRequestFinishedSuccesfully($state);
        $expected = $this->blockTestUtils->decorateWithRef($block,
            str_replace("[childMarker]", "<span id=\"temp-marker\"></span>", $expectedHtml)
        );
        $this->verifyResponseBodyEquals((object) ["result" => $expected],
                                        $state->spyingResponse);
    }
}
