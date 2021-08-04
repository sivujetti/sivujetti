<?php declare(strict_types=1);

namespace KuuraCms\Tests\Block;

use KuuraCms\App;
use KuuraCms\Tests\Utils\{BlockTestUtils, HttpApiTestTrait, PageTestUtils};
use Pike\{PikeException, TestUtils\DbTestCase, TestUtils\HttpTestUtils};

final class RenderBlockTest extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    private BlockTestUtils $blockTestUtils;
    private PageTestUtils $pageTestUtils;
    protected function setUp(): void {
        parent::setUp();
        $this->pageTestUtils = new PageTestUtils(self::$db);
        $this->blockTestUtils = new BlockTestUtils($this->pageTestUtils);
    }
    public function testRenderBlockRendersBlockShallowly(): void {
        $state = $this->setupTest();
        $this->makeKuuraApp($state);
        $this->sendRenderBlockRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyReturnedRenderOutput($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->testBlock = $this->pageTestUtils->makeTestPageData()->blocks[0];
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    private function makeKuuraApp(\TestState $state): void {
        $state->app = $this->makeApp(fn() => App::create(self::setGetConfig()));
    }
    private function sendRenderBlockRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/blocks/render",
                "POST", (object) ["block" => $state->testBlock]));
    }
    private function verifyRequestFinishedSuccesfully(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
    }
    private function verifyReturnedRenderOutput(\TestState $state): void {
        $expected = "<!-- block-start -bbbbbbbbbbbbbbbbbbb:Section -->" .
                    "<section class=\"\"><span id=\"temp-marker\"></span></section>" .
                    "<!-- block-end -bbbbbbbbbbbbbbbbbbb -->";
        $this->verifyResponseBodyEquals((object) ["result" => $expected],
                                        $state->spyingResponse);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderBlockValidatesBlockAndItsPropData(): void {
        $state = $this->setupTest();
        $this->setInvalidRenderer($state);
        $this->setInvalidPropData($state);
        $this->makeKuuraApp($state);
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
        $this->makeKuuraApp($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage("Unknown block type `DoesNotExist`");
        $this->sendRenderBlockRequest($state);
    }
}
