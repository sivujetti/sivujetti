<?php declare(strict_types=1);

namespace KuuraCms\Tests\Page;

use KuuraCms\App;
use KuuraCms\Block\BlockTree;
use KuuraCms\Block\Entities\Block;
use KuuraCms\Page\SiteAwareTemplate;
use KuuraCms\Tests\Utils\BlockTestUtils;
use KuuraCms\Tests\Utils\PageTestUtils;
use Pike\{Request, TestUtils\DbTestCase, TestUtils\HttpTestUtils};

final class RenderBasicPageTest extends DbTestCase {
    use HttpTestUtils;
    private PageTestUtils $pageTestUtils;
    protected function setUp(): void {
        parent::setUp();
        $this->pageTestUtils = new PageTestUtils(self::$db);
    }
    public function testRenderPageRendersPage(): void {
        $state = $this->setupTest();
        $this->makeKuuraApp($state);
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
        $state->app = null;
        $state->testPageBlocksTree = [$btu->makeBlockData(Block::TYPE_SECTION, "Main", "kuura:block-generic-wrapper", children: [
            $btu->makeBlockData(Block::TYPE_HEADING, propsData: ["text" => "Hello", "level" => 2]),
            $btu->makeBlockData(Block::TYPE_PARAGRAPH, propsData: ["text" => "Text"]),
        ], propsData: ["cssClass" => "", "bgImage" => ""])];
        $state->testLayoutBlocksTree = [$btu->makeBlockData(Block::TYPE_PARAGRAPH, propsData: ["text" => "Footer text"])];
        $state->testPageData = (object) [
            "slug" => "/hello",
            "path" => "/hello",
            "level" => 1,
            "title" => "<Hello>",
            "layoutId" => 1,
            "blocks" => BlockTree::toJson($state->testPageBlocksTree),
            "categories" => "[]",
        ];
        $state->testLayoutData = (object) [
            "blocks" => BlockTree::toJson($state->testLayoutBlocksTree),
        ];
        return $state;
    }
    private function insertTestPageToDb(\TestState $state): void {
        $this->pageTestUtils->insertPage($state->testPageData);
    }
    private function insertTestLayoutBlocksToDb(\TestState $state): void {
        self::$db->exec("INSERT INTO \${p}`layoutBlocks` VALUES (?,?)",
                        [$state->testLayoutData->blocks, $state->testPageData->layoutId]);
    }
    private function makeKuuraApp(\TestState $state): void {
        $state->app = $this->makeApp(fn() => App::create(self::setGetConfig()));
    }
    private function sendRenderPageRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            new Request($state->testPageData->slug, "GET"));
    }
    private function verifyRequestFinishedSuccesfully(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "text/html", $state->spyingResponse);
    }
    private function verifyRenderedCorrectPageAndLayout(\TestState $state): void {
        $expectedHeading = htmlspecialchars($state->testPageData->title);
        $this->assertStringContainsString("<h1 data-prop=\"title\">{$expectedHeading}</h1>",
                                          $state->spyingResponse->getActualBody());
        $expectedPageBlockHeading = $state->testPageBlocksTree[0]->children[0]->propsData[0]->value;
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
