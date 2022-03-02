<?php declare(strict_types=1);

namespace Sivujetti\Tests\Block;

use Sivujetti\{App, AppContext, SharedAPIContext, Template};
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\{ButtonBlockType, GlobalBlockReferenceBlockType};
use Sivujetti\Tests\Utils\DbDataHelper;

final class RenderEachBuiltInBlockTest extends RenderBlocksTestCase {
    private const TEST_RENDERER_NAME = "listing-custom";
    private const TEST_RENDERER_PATH = SIVUJETTI_SITE_PATH . "templates/" . self::TEST_RENDERER_NAME . ".tmpl.php";
    public static function setupBeforeClass(): void {
        parent::setUpBeforeClass();
        if (!is_file(self::TEST_RENDERER_PATH)) {
            $tmpl = "<p><?= \$this->e(\$props->listPageType), \"-\", count(\$props->__pages)" .
                ", \"-\", \$props->__pages ? \$props->__pages[0]->title : \"nil\" ?></p>";
            file_put_contents(self::TEST_RENDERER_PATH, $tmpl);
        }
    }
    public static function tearDownAfterClass(): void {
        parent::tearDownAfterClass();
        if (is_file(self::TEST_RENDERER_PATH))
            unlink(self::TEST_RENDERER_PATH);
    }
    public function testRenderBlockRendersButtons(): void {
        $makeExpectedHtml = fn($b, $lnk, $cls = "") =>
            $this->blockTestUtils->getExpectedButtonBlockOutput($b, $lnk, $cls, "[childMarker]")
        ;
        //
        $state = $this->setupRenderButtonBlocksTest();
        $this->makeTestSivujettiApp($state);
        $b = $state->testBlocks;
        $expectedHtml = $makeExpectedHtml($b[0], Template::makeUrl($b[0]->linkTo));
        $this->renderAndVerify($state, 0, $expectedHtml);
        //
        $expectedHtml2 = $makeExpectedHtml($b[1], $b[1]->linkTo, " escape&lt;");
        $this->renderAndVerify($state, 1, $expectedHtml2);
        //
        $expectedHtml2 = $makeExpectedHtml($b[2], $b[2]->linkTo, " {$b[2]->cssClass}");
        $this->renderAndVerify($state, 2, $expectedHtml2);
        //
        $expectedHtml3 = $makeExpectedHtml($b[3], null, null);
        $this->renderAndVerify($state, 3, $expectedHtml3);
        //
        $expectedHtml4 = $makeExpectedHtml($b[4], null, " {$b[4]->cssClass}");
        $this->renderAndVerify($state, 4, $expectedHtml4);
    }
    private function setupRenderButtonBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_BUTTON,
                propsData: ["html" => "Link text", "linkTo" => "/local",
                            "tagType" => ButtonBlockType::TAG_TYPE_LINK, "cssClass" => ""],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_BUTTON,
                propsData: ["html" => "Pre <validated>", "linkTo" => "https://external1.com",
                            "tagType" => ButtonBlockType::TAG_TYPE_LINK, "cssClass" => "escape<"],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_BUTTON,
                propsData: ["html" => "Pre <validated>", "linkTo" => "//external2.com",
                            "tagType" => ButtonBlockType::TAG_TYPE_LINK, "cssClass" => "some classes"],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_BUTTON,
                propsData: ["html" => "Button text", "linkTo" => "",
                            "tagType" => ButtonBlockType::TAG_TYPE_NORMAL_BUTTON, "cssClass" => ""],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_BUTTON,
                propsData: ["html" => "Submit button text", "linkTo" => "",
                            "tagType" => ButtonBlockType::TAG_TYPE_SUBMIT_BUTTON, "cssClass" => "foo"],
                id: "@auto"),
        ];
        return $state;
    }
    private function renderAndVerify(\TestState $state, int $testBlockIdx, string $expectedHtml): void {
        $block = $state->testBlocks[$testBlockIdx];
        $this->sendRenderBlockRequest($state, $block);
        $this->verifyRequestFinishedSuccesfully($state);
        $expected = $this->blockTestUtils->decorateWithRef($block,
            str_replace("[childMarker]", "<span id=\"temp-marker\"></span>", $expectedHtml)
        );
        $this->verifyResponseBodyEquals((object) ["result" => $expected],
                                        $state->spyingResponse);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderBlockRendersColumns(): void {
        $makeExpectedHtml = fn($b, $inline = "", $cls = "") =>
            "<div class=\"jet-columns num-cols-{$b->numColumns}{$inline}{$cls}\">" .
                "[childMarker]" .
            "</div>";
        //
        $state = $this->setupRenderColumnBlocksTest();
        $this->makeTestSivujettiApp($state);
        $b = $state->testBlocks;
        $expectedHtml = $makeExpectedHtml($b[0]);
        $this->renderAndVerify($state, 0, $expectedHtml);
        //
        $expectedHtml = $makeExpectedHtml($b[1], " inline");
        $this->renderAndVerify($state, 1, $expectedHtml);
        //
        $expectedHtml = $makeExpectedHtml($b[2], cls: " escape&lt;");
        $this->renderAndVerify($state, 2, $expectedHtml);
        //
        $expectedHtml = $makeExpectedHtml($b[3], cls: " some classes");
        $this->renderAndVerify($state, 3, $expectedHtml);
    }
    private function setupRenderColumnBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_COLUMNS,
                renderer: "sivujetti:block-generic-wrapper",
                propsData: ["numColumns" => 2, "takeFullWidth" => 1, "cssClass" => ""],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_COLUMNS,
                renderer: "sivujetti:block-generic-wrapper",
                propsData: ["numColumns" => 1, "takeFullWidth" => 0, "cssClass" => ""],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_COLUMNS,
                renderer: "sivujetti:block-generic-wrapper",
                propsData: ["numColumns" => 3, "takeFullWidth" => 1, "cssClass" => "escape<"],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_COLUMNS,
                renderer: "sivujetti:block-generic-wrapper",
                propsData: ["numColumns" => 12, "takeFullWidth" => 1, "cssClass" => "some classes"],
                id: "@auto"),
        ];
        return $state;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderBlockRendersGlobalBlockRefs(): void {
        $state = $this->setupRenderGlobalBlockRefBlocksTest();
        $this->makeTestSivujettiApp($state);
        //
        $expectedInnerBlock = $state->testGlobalBlockTreeBlocks[0];
        $this->renderAndVerify($state, 0,
            $this->blockTestUtils->decorateWithRef($expectedInnerBlock, "<p>{$expectedInnerBlock->text}</p>")
        );
        //
        $allOverrides = json_decode($state->testBlocks[1]->overrides);
        $paragraphOverrides = $allOverrides->{$expectedInnerBlock->id};
        $this->renderAndVerify($state, 1,
            $this->blockTestUtils->decorateWithRef($expectedInnerBlock,
                "<p class=\"{$paragraphOverrides->cssClass}\">{$paragraphOverrides->text}</p>")
        );
    }
    private function setupRenderGlobalBlockRefBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testGlobalBlockTreeBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_PARAGRAPH,
                propsData: ["text" => "© Year My Site", "cssClass" => ""],
                id: "@auto"),
        ];
        //
        $ddh = new DbDataHelper(self::$db);
        $insertId = $ddh->insertData((object) [
            "name" => "My footer",
            "blocks" => json_encode($state->testGlobalBlockTreeBlocks)
        ], "globalBlocks");
        //
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_GLOBAL_BLOCK_REF,
                propsData: ["globalBlockTreeId" => $insertId, "overrides" =>
                    GlobalBlockReferenceBlockType::EMPTY_OVERRIDES, "useOverrides" => 0],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_GLOBAL_BLOCK_REF,
                propsData: ["globalBlockTreeId" => $insertId, "overrides" => json_encode((object) [
                    $state->testGlobalBlockTreeBlocks[0]->id => (object) [
                        "text" => "Overriden",
                        "cssClass" => "special-footer",
                    ]
                ]), "useOverrides" => 1],
                id: "@auto"),
        ];
        return $state;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderBlockRendersHeadings(): void {
        $state = $this->setupRenderHeadingBlocksTest();
        $this->makeTestSivujettiApp($state);
        $b = $state->testBlocks;
        $this->renderAndVerify($state, 0, "<h1>{$b[0]->text}[childMarker]</h1>");
        $this->renderAndVerify($state, 1, "<h2 class=\"escape&lt;\">{$b[1]->text}[childMarker]</h2>");
        $this->renderAndVerify($state, 2, "<h3 class=\"{$b[2]->cssClass}\">{$b[2]->text}[childMarker]</h3>");
        $this->renderAndVerify($state, 3, "<h4>{$b[3]->text}[childMarker]</h4>");
        $this->renderAndVerify($state, 4, "<h5>{$b[4]->text}[childMarker]</h5>");
        $this->renderAndVerify($state, 5, "<h6>{$b[5]->text}[childMarker]</h6>");
    }
    private function setupRenderHeadingBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_HEADING,
                propsData: ["text" => "Heading text.", "level" => 1, "cssClass" => ""],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_HEADING,
                propsData: ["text" => "Pre <validated>", "level" => 2, "cssClass" => "escape<"],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_HEADING,
                propsData: ["text" => "Heading text.", "level" => 3, "cssClass" => "some classes"],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_HEADING,
                propsData: ["text" => "Heading text.", "level" => 4, "cssClass" => ""],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_HEADING,
                propsData: ["text" => "Heading text.", "level" => 5, "cssClass" => ""],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_HEADING,
                propsData: ["text" => "Heading text.", "level" => 6, "cssClass" => ""],
                id: "@auto"),
        ];
        return $state;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderBlockRendersImages(): void {
        $makeExpectedHtml = fn($url, $cls = "") => "<span class=\"image{$cls}\">" .
            "<img src=\"{$url}\" alt=\"\">[childMarker]" .
        "</span>";
        $state = $this->setupRenderImageBlocksTest();
        $this->makeTestSivujettiApp($state);
        $b = $state->testBlocks;
        $expectedHtml = $makeExpectedHtml(Template::makeUrl($b[0]->src, false));
        $this->renderAndVerify($state, 0, $expectedHtml);
        //
        $expectedHtml = $makeExpectedHtml(Template::makeUrl($b[1]->src, false), " escape&lt;");
        $this->renderAndVerify($state, 1, $expectedHtml);
        //
        $expectedHtml = $makeExpectedHtml($b[2]->src, " {$b[2]->cssClass}");
        $this->renderAndVerify($state, 2, $expectedHtml);
    }
    private function setupRenderImageBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_IMAGE,
                propsData: ["src" => "local-pic.png", "cssClass" => ""],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_IMAGE,
                propsData: ["src" => "local-dir/local-pic.jpg", "cssClass" => "escape<"],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_IMAGE,
                propsData: ["src" => "data:image/png...", "cssClass" => "some classes"],
                id: "@auto"),
        ];
        return $state;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderBlockRendersListings(): void {
        $state = $this->setupRenderListingBlocksTest();
        $this->makeTestSivujettiApp($state);
        $expectedHtml = "    <p>No pages found.</p>\r\n";
        $this->renderAndVerify($state, 0, $expectedHtml);
        //
        $this->insertTestPages($state);
        $expectedHtml = $state->makeExpectedHtml->__invoke($state->testPageData);
        $this->renderAndVerify($state, 0, $expectedHtml);
    }
    private function setupRenderListingBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testPageData = $this->pageTestUtils->makeTestPageData();
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_LISTING,
                renderer: "sivujetti:block-listing-pages-default",
                propsData: ["listPageType" => "Pages",
                    "renderWith" => "sivujetti:block-listing-pages-default",
                    "listFilters" => "[]"],
                id: "@auto"),
        ];
        $state->makeExpectedHtml = fn(object $pageData) => "<div class=\"listing listing-pages\">\r\n" .
        "        <article class=\"list-item list-item-/hello\">\r\n" .
        "        <h2>".Template::e($pageData->title)."</h2>\r\n" .
        "        <div><a href=\"".Template::makeUrl($pageData->slug)."\">Read more</a></div>\r\n" .
        "    </article>\r\n" .
        "    </div>\r\n";
        return $state;
    }
    private function insertTestPages(\TestState $state): void {
        $this->pageTestUtils->insertPage($state->testPageData, $state->customPageType ?? null);
    }
    public function testRenderBlockRendersCustomListings(): void {
        $makeExpectedHtml = fn($pageCount, $firstPageTitle) =>
            "<p>MyProducts-{$pageCount}-{$firstPageTitle}</p>"
        ;
        $state = $this->setupRenderCustomListingBlocksTest();
        $this->registerCustomPageType($state);
        $ctx = new AppContext;
        $ctx->apiCtx = new SharedAPIContext;
        $ctx->apiCtx->validBlockRenderers[] = $this->blockTestUtils->createBlockRenderer(self::TEST_RENDERER_NAME, "MyProducts");
        $state->app = $this->makeApp(fn() => App::create(self::setGetConfig(), $ctx));
        //
        $expectedHtml = $makeExpectedHtml("0", "nil");
        $this->renderAndVerify($state, 0, $expectedHtml);
        //
        $this->insertTestPages($state);
        $expectedHtml = $makeExpectedHtml("1", "<Hello>");
        $this->renderAndVerify($state, 0, $expectedHtml);
        $this->dropCustomPageType($state);
    }
    private function setupRenderCustomListingBlocksTest(): \TestState {
        $state = $this->setupRenderListingBlocksTest();
        $state->testPageData->ownField1 = "foo";
        $state->testPageData->ownField2 = 1;
        $state->testBlocks[0]->renderer = self::TEST_RENDERER_NAME;
        $this->blockTestUtils->setBlockProp($state->testBlocks[0], "renderWith", self::TEST_RENDERER_NAME);
        $this->blockTestUtils->setBlockProp($state->testBlocks[0], "listPageType", "MyProducts");
        $state->customPageType = null;
        return $state;
    }
    private function registerCustomPageType(\TestState $state): void {
        $state->customPageType = $this->pageTestUtils->registerTestCustomPageType();
    }
    private function dropCustomPageType(\TestState $state): void {
        $this->pageTestUtils->dropCustomPageType($state->customPageType);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderBlockRendersMenus(): void {
        $state = $this->setupRenderMenuBlocksTest();
        $this->makeTestSivujettiApp($state);
        $b = $state->testBlocks[0];
        $this->renderAndVerify($state, 0, "<nav><ul>" .
            "<li><a href=\"/sivujetti/\" data-prop=\"val\"></a></li>" .
        "</ul>[childMarker]</nav>");
    }
    private function setupRenderMenuBlocksTest(): \TestState {
        $state = parent::setupTest();
        $createMenuData = fn($links) => [
            "tree" => json_encode($links),
            "wrapStart" => "<nav>",
            "wrapEnd" => "</nav>",
            "treeStart" => "<ul>",
            "treeEnd" => "</ul>",
            "itemAttrs" => json_encode(["data-prop" => "val"]),
            "itemStart" => "<li>",
            "itemEnd" => "</li>",
        ];
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_MENU,
                renderer: "sivujetti:block-menu",
                propsData: $createMenuData([
                    (object) ["id" => "", "slug" => "", "text" => "", "children" => []]
                ]),
                id: "@auto"),
        ];
        return $state;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderBlockRendersParagraphs(): void {
        $state = $this->setupRenderParagraphBlocksTest();
        $this->makeTestSivujettiApp($state);
        $this->renderAndVerify($state, 0, "<p>{$state->testBlocks[0]->text}[childMarker]</p>");
        $this->renderAndVerify($state, 1, "<p class=\"escape&lt;\">{$state->testBlocks[1]->text}[childMarker]</p>");
    }
    private function setupRenderParagraphBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_PARAGRAPH,
                propsData: ["text" => "Paragraph text.", "cssClass" => ""],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_PARAGRAPH,
                propsData: ["text" => "Pre <validated>", "cssClass" => "escape<"],
                id: "@auto"),
        ];
        return $state;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderBlockRendersRichTexts(): void {
        $state = $this->setupRenderRichTextBlocksTest();
        $this->makeTestSivujettiApp($state);
        $this->renderAndVerify($state, 0, "{$state->testBlocks[0]->html}[childMarker]");
    }
    private function setupRenderRichTextBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_RICH_TEXT,
                propsData: ["html" => "<p>Pre-validated <em>html</em></p>"],
                id: "@auto"),
        ];
        return $state;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderBlockRendersSections(): void {
        $makeExpectedHtml = fn($cls = "", $style = "") => "<section class=\"{$cls}\"{$style}>" .
            "<div data-block-root>[childMarker]</div>" .
        "</section>";
        $state = $this->setupRenderSectionBlocksTest();
        $this->makeTestSivujettiApp($state);
        $b = $state->testBlocks;
        $expectedHtml = $makeExpectedHtml();
        $this->renderAndVerify($state, 0, $expectedHtml);
        //
        $expectedHtml = $makeExpectedHtml("escape&lt;",
            " style=\"background-image:url('".Template::makeUrl($b[1]->bgImage)."')\"");
        $this->renderAndVerify($state, 1, $expectedHtml);
        //
        $expectedHtml = $makeExpectedHtml("some classes",
            " style=\"background-image:url('".Template::makeUrl($b[2]->bgImage)."')\"");
        $this->renderAndVerify($state, 2, $expectedHtml);
    }
    private function setupRenderSectionBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_SECTION,
                renderer: "sivujetti:block-generic-wrapper",
                propsData: ["bgImage" => "", "cssClass" => ""],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_SECTION,
                renderer: "sivujetti:block-generic-wrapper",
                propsData: ["bgImage" => "local-pic.png", "cssClass" => "escape<"],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_SECTION,
                renderer: "sivujetti:block-generic-wrapper",
                propsData: ["bgImage" => "local-dir/local-pic.webp", "cssClass" => "some classes"],
                id: "@auto"),
        ];
        return $state;
    }
}
