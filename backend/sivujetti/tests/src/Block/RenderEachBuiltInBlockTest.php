<?php declare(strict_types=1);

namespace Sivujetti\Tests\Block;

use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\GlobalBlockReferenceBlockType;
use Sivujetti\Template;
use Sivujetti\Tests\Utils\DbDataHelper;

final class RenderEachBuiltInBlockTest extends RenderBlocksTestCase {
    public function testRenderBlockRendersButtons(): void {
        $makeExpectedHtml = fn($b, $lnk, $cls = "") => "<p class=\"button\">" .
            "<a href=\"{$lnk}\" class=\"btn{$cls}\" data-block-root>" .
                "{$b->html}[childMarker]" .
            "</a>" .
        "</p>";
        //
        $state = $this->setupRenderButtonBlocksTest();
        $b = $state->testBlocks;
        $this->makeTestSivujettiApp($state);
        $expectedHtml = $makeExpectedHtml($b[0], Template::makeUrl($b[0]->linkTo));
        $this->renderAndVerify($state, 0, $expectedHtml);
        //
        $expectedHtml2 = $makeExpectedHtml($b[1], $b[1]->linkTo, " escape&lt;");
        $this->renderAndVerify($state, 1, $expectedHtml2);
        //
        $expectedHtml2 = $makeExpectedHtml($b[2], $b[2]->linkTo, " {$b[2]->cssClass}");
        $this->renderAndVerify($state, 2, $expectedHtml2);
    }
    protected function setupRenderButtonBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_BUTTON,
                propsData: ["html" => "Link text", "linkTo" => "/local", "cssClass" => ""],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_BUTTON,
                propsData: ["html" => "Pre <validated>", "linkTo" => "https://external1.com", "cssClass" => "escape<"],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_BUTTON,
                propsData: ["html" => "Pre <validated>", "linkTo" => "//external2.com", "cssClass" => "some classes"],
                id: "@auto"),
        ];
        return $state;
    }
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
    protected function setupRenderGlobalBlockRefBlocksTest(): \TestState {
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
                    GlobalBlockReferenceBlockType::EMPTY_OVERRIDES],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_GLOBAL_BLOCK_REF,
                propsData: ["globalBlockTreeId" => $insertId, "overrides" => json_encode((object) [
                    $state->testGlobalBlockTreeBlocks[0]->id => (object) [
                        "text" => "Overriden",
                        "cssClass" => "special-footer",
                    ]
                ])],
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
    protected function setupRenderHeadingBlocksTest(): \TestState {
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
    protected function setupRenderImageBlocksTest(): \TestState {
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


    public function testRenderBlockRendersMenus(): void {
        $state = $this->setupRenderMenuBlocksTest();
        $this->makeTestSivujettiApp($state);
        $b = $state->testBlocks[0];
        $this->renderAndVerify($state, 0, "<nav><ul>" .
            "<li><a href=\"/sivujetti/\" data-prop=\"val\"></a></li>" .
        "</ul>[childMarker]</nav>");
    }
    protected function setupRenderMenuBlocksTest(): \TestState {
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
    protected function setupRenderParagraphBlocksTest(): \TestState {
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
    protected function setupRenderRichTextBlocksTest(): \TestState {
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
    protected function setupRenderSectionBlocksTest(): \TestState {
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
