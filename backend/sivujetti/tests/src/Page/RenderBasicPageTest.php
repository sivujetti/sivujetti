<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use Sivujetti\Block\BlockTree;
use Sivujetti\Block\Entities\Block;
use Sivujetti\Page\SiteAwareTemplate;
use Sivujetti\Tests\Utils\BlockTestUtils;

final class RenderBasicPageTest extends RenderPageTestCase {
    public function testRenderPageRendersPage(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
        $this->insertTestPageToDb($state);
        $this->insertTestLayoutBlocksToDb($state);
        $this->sendRenderPageRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyRenderedCorrectPageAndLayout($state);
        $this->verifyThemeCanRegisterCssFiles($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $btu = new BlockTestUtils();
        $state->testLayoutBlocksTree = [
            $btu->makeBlockData(Block::TYPE_PARAGRAPH, propsData: ["text" => "Footer text", "cssClass" => ""])
        ];
        $state->testPageData = $this->pageTestUtils->makeTestPageData();
        $state->testLayoutData = (object) [
            "blocks" => BlockTree::toJson($state->testLayoutBlocksTree),
        ];
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    private function insertTestLayoutBlocksToDb(\TestState $state): void {
        $this->dbDataHelper->insertData((object) ["blocks" => $state->testLayoutData->blocks,
                                                  "layoutId" => $state->testPageData->layoutId],
                                        "layoutBlocks");
    }
    private function verifyRenderedCorrectPageAndLayout(\TestState $state): void {
        $expectedHeading = htmlspecialchars($state->testPageData->title);
        $this->assertStringContainsString("<h1 data-prop=\"title\">{$expectedHeading}</h1>",
                                          $state->spyingResponse->getActualBody());
        $expectedPageBlockHeading = $state->testPageData->blocks[0]->children[0]->propsData[0]->value;
        $this->assertStringContainsString("<h2>{$expectedPageBlockHeading}</h2>",
                                          $state->spyingResponse->getActualBody());
        $expectedFooterText = $state->testLayoutBlocksTree[0]->propsData[0]->value;
        $this->assertStringContainsString("<p>{$expectedFooterText}</p>",
                                          $state->spyingResponse->getActualBody());
    }
    private function verifyThemeCanRegisterCssFiles(\TestState $state): void {
        $expectedUrl = SiteAwareTemplate::makeUrl("/public/basic-site.css");
        $this->assertStringContainsString("<link href=\"{$expectedUrl}\" rel=\"stylesheet\">",
            $state->spyingResponse->getActualBody());
    }
}
