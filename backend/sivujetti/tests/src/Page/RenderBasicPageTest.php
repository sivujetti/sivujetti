<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use MySite\Theme;
use Sivujetti\Block\BlockTree;
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\GlobalBlockReferenceBlockType;
use Sivujetti\Page\WebPageAwareTemplate;
use Sivujetti\Tests\Utils\BlockTestUtils;

final class RenderBasicPageTest extends RenderPageTestCase {
    public function testRenderPageRendersPage(): void {
        $state = $this->setupTest();
        $this->makeRenderPageTestApp($state);
        $this->insertTestGlobalBlocksToDb($state);
        $this->insertTestPageToDb($state);
        $this->sendRenderPageRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyRenderedCorrectPageAndLayout($state);
        $this->verifyThemeCanRegisterCssFiles($state);
        $this->verifyRenderedGlobalStyles($state);
        $this->verifyRenderedBlockTypeBaseStyles($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $btu = new BlockTestUtils();
        $state->testGlobalBlockTree = [
            $btu->makeBlockData(Block::TYPE_PARAGRAPH, id: "@auto", propsData: ["text" => "Footer text", "cssClass" => ""])
        ];
        $state->testGlobalBlockData = (object) [
            "id" => "1",
            "name" => "Footer",
            "blocks" => BlockTree::toJson($state->testGlobalBlockTree),
        ];
        $state->testPageData = $this->pageTestUtils->makeTestPageData();
        $state->testPageData->blocks[] = $btu->makeBlockData(Block::TYPE_GLOBAL_BLOCK_REF,
            propsData: ["globalBlockTreeId" => $state->testGlobalBlockData->id, "overrides" =>
                GlobalBlockReferenceBlockType::EMPTY_OVERRIDES, "useOverrides" => 0]
        );
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    private function insertTestGlobalBlocksToDb(\TestState $state): void {
        $this->dbDataHelper->insertData((object) ["id" => $state->testGlobalBlockData->id,
                                                  "name" => $state->testGlobalBlockData->name,
                                                  "blocks" => $state->testGlobalBlockData->blocks],
                                        "globalBlocks");
    }
    private function verifyRenderedCorrectPageAndLayout(\TestState $state): void {
        $expectedPageBlockHeading = $state->testPageData->blocks[0]->children[0]->propsData[0]->value;
        $this->assertStringContainsString("<h2>{$expectedPageBlockHeading}</h2>",
                                          $state->spyingResponse->getActualBody());
        $expectedFooterText = $state->testGlobalBlockTree[0]->propsData[0]->value;
        $this->assertStringContainsString("<p>{$expectedFooterText}</p>",
                                          $state->spyingResponse->getActualBody());
    }
    private function verifyThemeCanRegisterCssFiles(\TestState $state): void {
        $expectedUrl = WebPageAwareTemplate::makeUrl("/public/" . Theme::TEST_CSS_FILE_NAME);
        $this->assertStringContainsString("<link href=\"{$expectedUrl}\" rel=\"stylesheet\">",
            $state->spyingResponse->getActualBody());
    }
    private function verifyRenderedGlobalStyles(\TestState $state): void {
        $noStyles = ""; // backend/sivujetti/tests/test-db-init.php (INSERT INTO themes)
        $this->assertStringContainsString("<style>:root {" . $noStyles . "}</style>",
            $state->spyingResponse->getActualBody());
    }
    private function verifyRenderedBlockTypeBaseStyles(\TestState $state): void {
        $t = "\"Section\"";
        $expectedCss = "[data-block-type={$t}] { padding: 4rem 2rem; }";
        $this->assertStringContainsString("<style data-styles-for-block-type={$t}>{$expectedCss}</style>",
                                          $state->spyingResponse->getActualBody());
    }
}
