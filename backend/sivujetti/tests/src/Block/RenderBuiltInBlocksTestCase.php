<?php declare(strict_types=1);

namespace Sivujetti\Tests\Block;

abstract class RenderBuiltInBlocksTestCase extends RenderBlocksTestCase {
    protected function renderAndVerify(\TestState $state, int $testBlockIdx, string $expectedHtml): void {
        $block = $state->testBlocks[$testBlockIdx];
        $this->sendRenderBlockRequest($state, $block);
        $this->verifyRequestFinishedSuccesfully($state);
        if (!useReduxBlockTree) { // @featureFlagConditionUseReduxBlockTree
        $expected = $this->blockTestUtils->decorateWithRef($block,
            str_replace("[childMarker]", "<span id=\"temp-marker\"></span>", $expectedHtml)
        );
        } else {
        $expected = $this->blockTestUtils->decorateWithRef($block,
            str_replace("[childMarker]", "<!-- children-start --><!-- children-placeholder --><!-- children-end -->", $expectedHtml)
        );
        }
        $this->verifyResponseBodyEquals(json_encode((object) ["result" => $expected], JSON_UNESCAPED_UNICODE),
                                        $state->spyingResponse);
    }
}
