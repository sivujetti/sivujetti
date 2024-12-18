<?php declare(strict_types=1);

namespace Sivujetti\Tests\Block;

use Sivujetti\Template;
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\{ButtonBlockType, GlobalBlockReferenceBlockType, ImageBlockType};
use Sivujetti\Tests\Utils\{DbDataHelper, PluginTestCase};

final class RenderEachBuiltInBlockTest extends RenderBuiltInBlocksTestCase {
    public function testRenderBlockRendersButtons(): void {
        $makeExpectedHtml = fn($b, $lnk, $cls = "") =>
            $this->blockTestUtils->getExpectedButtonBlockOutput($b, $lnk, $cls)
        ;
        $tmpl = PluginTestCase::createTemplate();
        //
        $state = $this->setupRenderButtonBlocksTest();
        $this->makeTestSivujettiApp($state);
        $b = $state->testBlocks;
        $expectedHtml = $makeExpectedHtml($b[0], $tmpl->makeUrl($b[0]->linkTo));
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
            "<div data-block=\"{$b->id}\" data-block-type=\"Code\" class=\"j-Code{$cls}\">" .
                "{$b->code}" .
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
        $expectedHtml = $this->blockTestUtils->getExpectedTextBlockOutput($expectedInnerBlock);
        $this->renderAndVerify($state, 0, $expectedHtml);
    }
    private function setupRenderGlobalBlockRefBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testGlobalBlockTreeBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_TEXT,
                propsData: ["html" => "<p>© Year My Site</p>"],
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


    public function testRenderBlockRendersImages(): void {
        $makeExpectedHtml = fn($b, $url, $cls = "", $altText = "", $caption = "") =>
            "<figure data-block=\"{$b->id}\" data-block-type=\"Image\" class=\"j-Image{$cls}\">" .
                "<img src=\"{$url}\" alt=\"{$altText}\">" .
                ($caption ? "<figcaption>{$caption}</figcaption>" : "") .
                "" .
            "</figure>";
        $state = $this->setupRenderImageBlocksTest();
        $this->makeTestSivujettiApp($state);
        $b = $state->testBlocks;
        $tmpl = PluginTestCase::createTemplate();
        $expectedHtml = $makeExpectedHtml($b[0], $tmpl->makeUrl("public/uploads/{$b[0]->src}", false));
        $this->renderAndVerify($state, 0, $expectedHtml);
        //
        $expectedHtml = $makeExpectedHtml($b[1], ImageBlockType::PLACEHOLDER_SRC, cls: " escape&quot;", altText: "&quot;escape");
        $this->renderAndVerify($state, 1, $expectedHtml);
        //
        $expectedHtml = $makeExpectedHtml($b[2], ImageBlockType::PLACEHOLDER_SRC, caption: "escape&quot;");
        $this->renderAndVerify($state, 2, $expectedHtml);
        //
        $expectedHtml = $makeExpectedHtml($b[3], Template::escAttr($b[3]->src));
        $this->renderAndVerify($state, 3, $expectedHtml);
        //
        $expectedHtml = $makeExpectedHtml($b[4], "//" . Template::escAttr($b[4]->src));
        $this->renderAndVerify($state, 4, $expectedHtml);
        //
        $expectedHtml = $makeExpectedHtml($b[5], Template::escAttr($b[5]->src));
        $this->renderAndVerify($state, 5, $expectedHtml);
    }
    private function setupRenderImageBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_IMAGE,
                propsData: ["src" => "local-pic.png", "altText" => "", "caption" => ""],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_IMAGE,
                propsData: ["src" => null, "altText" => "\"escape", "caption" => ""],
                styleClasses: "escape\"",
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_IMAGE,
                propsData: ["src" => null, "altText" => "", "caption" => "escape\""],
                styleClasses: "",
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_IMAGE,
                propsData: ["src" => "https://ext.com/pic.png", "altText" => "", "caption" => ""],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_IMAGE,
                propsData: ["src" => "ext.com/pi\"c.webp", "altText" => "", "caption" => ""],
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_IMAGE,
                propsData: ["src" => "/local-di\"r/pic.png", "altText" => "", "caption" => ""],
                id: "@auto"),
        ];
        return $state;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderBlockRendersMenus(): void {
        $state = $this->setupRenderMenuBlocksTest();
        $this->makeTestSivujettiApp($state);
        $tmpl = PluginTestCase::createTemplate();
        $this->renderAndVerify($state, 0, "<nav data-block=\"{$state->testBlocks[0]->id}\"" .
            " data-block-type=\"Menu\" class=\"j-Menu\">" .
            "<ul class=\"level-0\">" .
                "<li class=\"level-0\"><a href=\"{$tmpl->makeUrl("/")}\"></a></li>" .
            "</ul>" .
        "</nav>");
    }
    private function setupRenderMenuBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_MENU,
                propsData: ["tree" =>
                    [(object) ["id" => "", "slug" => "/", "text" => "", "children" => []]]
                ],
                id: "@auto"),
        ];
        return $state;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderBlockRendersSections(): void {
        $makeExpectedHtml = fn($b, $cls = "", $style = "") =>
            "<section class=\"j-Section{$cls}\"{$style} data-block-type=\"Section\" data-block=\"{$b->id}\">" .
                "<div data-block-root></div>" .
            "</section>";
        $tmpl = PluginTestCase::createTemplate();
        $state = $this->setupRenderSectionBlocksTest();
        $this->makeTestSivujettiApp($state);
        $b = $state->testBlocks;
        $expectedHtml = $makeExpectedHtml($b[0]);
        $this->renderAndVerify($state, 0, $expectedHtml);
        //
        $expectedHtml = $makeExpectedHtml($b[1], " escape&quot;",
            " style=\"background-image:url('{$tmpl->makeUrl("public/uploads/{$b[1]->bgImage}", false)}')\"");
        $this->renderAndVerify($state, 1, $expectedHtml);
        //
        $expectedHtml = $makeExpectedHtml($b[2], " some classes",
            " style=\"background-image:url('".Template::escAttr($b[2]->bgImage)."')\"");
        $this->renderAndVerify($state, 2, $expectedHtml);
        //
        $expectedHtml = $makeExpectedHtml($b[3], "",
            " style=\"background-image:url('//".Template::escAttr($b[3]->bgImage)."')\"");
        $this->renderAndVerify($state, 3, $expectedHtml);
        //
        $expectedHtml = $makeExpectedHtml($b[4], "",
            " style=\"background-image:url('".Template::escAttr($b[4]->bgImage)."')\"");
        $this->renderAndVerify($state, 4, $expectedHtml);
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
                propsData: ["bgImage" => "https://ext.com/pic.png"],
                styleClasses: "some classes",
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_SECTION,
                renderer: "sivujetti:block-generic-wrapper",
                propsData: ["bgImage" => "ext.com/pi\"c.webp"],
                styleClasses: "",
                id: "@auto"),
            $this->blockTestUtils->makeBlockData(Block::TYPE_SECTION,
                renderer: "sivujetti:block-generic-wrapper",
                propsData: ["bgImage" => "/local-di\"r/pic.png"],
                styleClasses: "",
                id: "@auto"),
        ];
        return $state;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderBlockRendersTexts(): void {
        $state = $this->setupRenderTextBlocksTest();
        $this->makeTestSivujettiApp($state);
        $b = $state->testBlocks[0];
        $this->renderAndVerify($state, 0, "<div data-block=\"{$b->id}\" data-block-type=\"Text\" class=\"j-Text\">" .
            "{$b->html}" .
        "</div>");
    }
    private function setupRenderTextBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_TEXT,
                propsData: ["html" => "<p>Pre-validated <em>html</em></p>"],
                id: "@auto"),
        ];
        return $state;
    }
}
