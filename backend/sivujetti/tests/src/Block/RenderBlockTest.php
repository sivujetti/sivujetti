<?php declare(strict_types=1);

namespace Sivujetti\Tests\Block;

use Pike\PikeException;

final class RenderBlockTest extends RenderBlocksTestCase {
    public function testRenderBlockRendersBlockShallowly(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
        $this->sendRenderBlockRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyReturnedRenderOutput($state);
    }
    protected function setupTest(): \TestState {
        $state = parent::setupTest();
        $state->testBlock = $this->pageTestUtils->makeTestPageData()->blocks[0];
        return $state;
    }
    private function verifyReturnedRenderOutput(\TestState $state): void {
        $expected = $this->blockTestUtils->decorateWithRef($state->testBlock,
            "<section class=\"\" data-block-type=\"Section\" data-block=\"{$state->testBlock->id}\">" .
                "<div data-block-root><span id=\"temp-marker\"></span></div>" .
            "</section>"
        );
        $this->verifyResponseBodyEquals((object) ["result" => $expected],
                                        $state->spyingResponse);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderBlockValidatesBlockAndItsPropData(): void {
        $state = $this->setupTest();
        $this->setInvalidRenderer($state);
        $this->setInvalidPropData($state);
        $this->makeTestSivujettiApp($state);
        $this->sendRenderBlockRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "The value of renderer was not in the list",
            "cssClass must be string",
            "The length of cssClass must be 1024 or less"
        ], $state->spyingResponse);
    }
    private function setInvalidRenderer(\TestState $state): void {
        $sectionBlock = $state->testBlock;
        $sectionBlock->renderer = "does-not-exist";
    }
    private function setInvalidPropData(\TestState $state): void {
        $sectionBlock = $state->testBlock;
        $sectionBlock->cssClass = [];
        $sectionBlock->propsData[0]->value = []; // cssClass
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderBlockRejectsIfBlockTypeIsNotRegistered(): void {
        $state = $this->setupTest();
        $state->testBlock->type = "DoesNotExist";
        $this->makeTestSivujettiApp($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage("Unknown block type `DoesNotExist`");
        $this->sendRenderBlockRequest($state);
    }
}
