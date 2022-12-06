<?php declare(strict_types=1);

namespace Sivujetti\Tests\Block;

use Sivujetti\{Template};
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\{ButtonBlockType, GlobalBlockReferenceBlockType, ImageBlockType};
use Sivujetti\Tests\Utils\{DbDataHelper};

final class RenderEachBuiltInBlockTest extends RenderBuiltInBlocksTestCase {
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
        $expectedHtml2 = $makeExpectedHtml($b[1], $b[1]->linkTo, " escape&quot;");
        $this->renderAndVerify($state, 1, $expectedHtml2);
        //
        $expectedHtml2 = $makeExpectedHtml($b[2], $b[2]->linkTo, " {$b[2]->styleClasses}");
        $this->renderAndVerify($state, 2, $expectedHtml2);
        //
        $expectedHtml4 = $makeExpectedHtml($b[3], null, " {$b[3]->styleClasses}");
        $this->renderAndVerify($state, 3, $expectedHtml4);
    }
    private function setupRenderButtonBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_BUTTON,
                propsData: ["html" => "Link text", "linkTo" => "/local",
                            "tagType" => ButtonBlockType::TAG_TYPE_LINK,],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_BUTTON,
                propsData: ["html" => "Pre <validated>", "linkTo" => "https://external1.com",
                            "tagType" => ButtonBlockType::TAG_TYPE_LINK,],
                styleClasses: "escape\"",
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_BUTTON,
                propsData: ["html" => "Pre <validated>", "linkTo" => "http://external2.com",
                            "tagType" => ButtonBlockType::TAG_TYPE_LINK,],
                styleClasses: "some classes",
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_BUTTON,
                propsData: ["html" => "Submit button text", "linkTo" => null,
                            "tagType" => ButtonBlockType::TAG_TYPE_SUBMIT_BUTTON,],
                styleClasses: "foo",
                id: "@auto"),
        ];
        return $state;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderBlockRendersCodeBlocks(): void {
        $makeExpectedHtml = fn($b, $cls = "") =>
            "<div class=\"j-Code{$cls}\" data-block-type=\"Code\" data-block=\"{$b->id}\">" .
                "{$b->code}[childMarker]" .
            "</div>";
        //
        $state = $this->setupRenderCodeBlocksTest();
        $this->makeTestSivujettiApp($state);
        $b = $state->testBlocks;
        $expectedHtml = $makeExpectedHtml($b[0]);
        $this->renderAndVerify($state, 0, $expectedHtml);
        //
        $expectedHtml2 = $makeExpectedHtml($b[1], " escape&quot;");
        $this->renderAndVerify($state, 1, $expectedHtml2);
    }
    private function setupRenderCodeBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_CODE,
                propsData: ["code" => "<iframe></iframe>"],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_CODE,
                propsData: ["code" => "<iframe></iframe>"],
                styleClasses: "escape\"",
                id: "@auto"),
        ];
        return $state;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderBlockRendersColumns(): void {
        $makeExpectedHtml = fn($b, $inline = "", $cls = "") =>
            "<div class=\"j-Columns num-cols-{$b->numColumns}{$inline}{$cls}\"" .
            " data-block-type=\"Columns\"" .
            " data-block=\"{$b->id}\">" .
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
        $expectedHtml = $makeExpectedHtml($b[2], cls: " escape&quot;");
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
                propsData: ["numColumns" => 2, "takeFullWidth" => 1],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_COLUMNS,
                renderer: "sivujetti:block-generic-wrapper",
                propsData: ["numColumns" => 1, "takeFullWidth" => 0],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_COLUMNS,
                renderer: "sivujetti:block-generic-wrapper",
                propsData: ["numColumns" => 3, "takeFullWidth" => 1],
                styleClasses: "escape\"",
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_COLUMNS,
                renderer: "sivujetti:block-generic-wrapper",
                propsData: ["numColumns" => 12, "takeFullWidth" => 1],
                styleClasses: "some classes",
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
        $exp = $this->blockTestUtils->getExpectedParagraphBlockOutput($expectedInnerBlock);
        $this->renderAndVerify($state, 0,
            $this->blockTestUtils->decorateWithRef($expectedInnerBlock, $exp)
        );
    }
    private function setupRenderGlobalBlockRefBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testGlobalBlockTreeBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_PARAGRAPH,
                propsData: ["text" => "© Year My Site"],
                id: "@auto"),
        ];
        //
        $ddh = new DbDataHelper(self::$db);
        $gbt = (object) [
            "id" => "-3456789012abcdefghi",
            "name" => "My footer",
            "blocks" => json_encode($state->testGlobalBlockTreeBlocks)
        ];
        $ddh->insertData($gbt, "globalBlockTrees");
        //
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_GLOBAL_BLOCK_REF,
                propsData: ["globalBlockTreeId" => $gbt->id, "overrides" =>
                    GlobalBlockReferenceBlockType::EMPTY_OVERRIDES, "useOverrides" => 0],
                id: "@auto"),
        ];
        return $state;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderBlockRendersHeadings(): void {
        $makeExpextedOutput = fn($b, $expectedTag, $cls = "") =>
            $this->blockTestUtils->getExpectedHeadingBlockOutput($b, $expectedTag, $cls, "[childMarker]")
        ;
        //
        $state = $this->setupRenderHeadingBlocksTest();
        $this->makeTestSivujettiApp($state);
        $b = $state->testBlocks;
        $this->renderAndVerify($state, 0, $makeExpextedOutput($b[0], "h1"));
        $this->renderAndVerify($state, 1, $makeExpextedOutput($b[1], "h2", " escape&quot;"));
        $this->renderAndVerify($state, 2, $makeExpextedOutput($b[2], "h3", " {$b[2]->styleClasses}"));
        $this->renderAndVerify($state, 3, $makeExpextedOutput($b[3], "h4"));
        $this->renderAndVerify($state, 4, $makeExpextedOutput($b[4], "h5"));
        $this->renderAndVerify($state, 5, $makeExpextedOutput($b[5], "h6"));
    }
    private function setupRenderHeadingBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_HEADING,
                propsData: ["text" => "Heading text.", "level" => 1],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_HEADING,
                propsData: ["text" => "Pre <validated>", "level" => 2],
                styleClasses: "escape\"",
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_HEADING,
                propsData: ["text" => "Heading text.", "level" => 3],
                styleClasses: "some classes",
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_HEADING,
                propsData: ["text" => "Heading text.", "level" => 4],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_HEADING,
                propsData: ["text" => "Heading text.", "level" => 5],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_HEADING,
                propsData: ["text" => "Heading text.", "level" => 6],
                id: "@auto"),
        ];
        return $state;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderBlockRendersImages(): void {
        $makeExpectedHtml = fn($b, $url, $cls = "") =>
            "<figure class=\"j-Image{$cls}\" data-block-type=\"Image\" data-block=\"{$b->id}\">" .
                "<img src=\"{$url}\" alt=\"\">[childMarker]" .
            "</figure>";
        $state = $this->setupRenderImageBlocksTest();
        $this->makeTestSivujettiApp($state);
        $b = $state->testBlocks;
        $expectedHtml = $makeExpectedHtml($b[0], Template::makeUrl("public/uploads/{$b[0]->src}", false));
        $this->renderAndVerify($state, 0, $expectedHtml);
        //
        $expectedHtml = $makeExpectedHtml($b[1], ImageBlockType::PLACEHOLDER_SRC, " escape&quot;");
        $this->renderAndVerify($state, 1, $expectedHtml);
    }
    private function setupRenderImageBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_IMAGE,
                propsData: ["src" => "local-pic.png"],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_IMAGE,
                propsData: ["src" => null],
                styleClasses: "escape\"",
                id: "@auto"),
        ];
        return $state;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderBlockRendersMenus(): void {
        $state = $this->setupRenderMenuBlocksTest();
        $this->makeTestSivujettiApp($state);
        $replaceAttrs = fn($tmpl) =>
            str_replace("{defaultAttrs}", " class=\"j-Menu\" data-block-type=\"Menu\"" .
                " data-block=\"{$state->testBlocks[0]->id}\"", $tmpl)
        ;
        $this->renderAndVerify($state, 0, $replaceAttrs("<nav{defaultAttrs}><ul>") .
            "<li><a href=\"" . Template::makeUrl("/") . "\" data-prop=\"val\"></a></li>" .
        "</ul>[childMarker]</nav>");
    }
    private function setupRenderMenuBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_MENU,
                renderer: "sivujetti:block-menu",
                propsData: $this->blockTestUtils->createMenuBlockData([
                    (object) ["id" => "", "slug" => "/", "text" => "", "children" => []]
                ]),
                id: "@auto"),
        ];
        return $state;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderBlockRendersParagraphs(): void {
        $makeExpextedOutput = fn($b, $cls="") => $this->blockTestUtils->getExpectedParagraphBlockOutput($b, $cls, "[childMarker]");
        //
        $state = $this->setupRenderParagraphBlocksTest();
        $this->makeTestSivujettiApp($state);
        $this->renderAndVerify($state, 0, $makeExpextedOutput($state->testBlocks[0]));
        $this->renderAndVerify($state, 1, $makeExpextedOutput($state->testBlocks[1], " escape&quot;"));
    }
    private function setupRenderParagraphBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_PARAGRAPH,
                propsData: ["text" => "Paragraph text."],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_PARAGRAPH,
                propsData: ["text" => "Pre <validated>"],
                styleClasses: "escape\"",
                id: "@auto"),
        ];
        return $state;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderBlockRendersRichTexts(): void {
        $state = $this->setupRenderRichTextBlocksTest();
        $this->makeTestSivujettiApp($state);
        $b = $state->testBlocks[0];
        $this->renderAndVerify($state, 0, "<div class=\"j-RichText\" data-block-type=\"RichText\" data-block=\"{$b->id}\">" .
            "{$b->html}[childMarker]" .
        "</div>");
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
        $makeExpectedHtml = fn($b, $cls = "", $style = "") =>
            "<section class=\"j-Section{$cls}\"{$style} data-block-type=\"Section\" data-block=\"{$b->id}\">" .
                "<div data-block-root>[childMarker]</div>" .
            "</section>";
        $state = $this->setupRenderSectionBlocksTest();
        $this->makeTestSivujettiApp($state);
        $b = $state->testBlocks;
        $expectedHtml = $makeExpectedHtml($b[0]);
        $this->renderAndVerify($state, 0, $expectedHtml);
        //
        $expectedHtml = $makeExpectedHtml($b[1], " escape&quot;",
            " style=\"background-image:url('".Template::makeUrl($b[1]->bgImage, false)."')\"");
        $this->renderAndVerify($state, 1, $expectedHtml);
        //
        $expectedHtml = $makeExpectedHtml($b[2], " some classes",
            " style=\"background-image:url('".Template::makeUrl($b[2]->bgImage, false)."')\"");
        $this->renderAndVerify($state, 2, $expectedHtml);
    }
    private function setupRenderSectionBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_SECTION,
                renderer: "sivujetti:block-generic-wrapper",
                propsData: ["bgImage" => ""],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_SECTION,
                renderer: "sivujetti:block-generic-wrapper",
                propsData: ["bgImage" => "local-pic.png"],
                styleClasses: "escape\"",
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_SECTION,
                renderer: "sivujetti:block-generic-wrapper",
                propsData: ["bgImage" => "local-dir/local-pic.webp"],
                styleClasses: "some classes",
                id: "@auto"),
        ];
        return $state;
    }
}
