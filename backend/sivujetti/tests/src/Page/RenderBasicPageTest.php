<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use Laminas\Dom\Query;
use MySite\Theme;
use Pike\ArrayUtils;
use Sivujetti\Block\BlockTree;
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\GlobalBlockReferenceBlockType;
use Sivujetti\Page\WebPageAwareTemplate;
use Sivujetti\Template;
use Sivujetti\Tests\Utils\BlockTestUtils;
use Sivujetti\Theme\ThemeCssFileUpdaterWriter;

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
        $this->verifyRenderedHead($state);
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
        $headingBlock = $state->testPageData->blocks[0]->children[0];
        $expectedPageBlockHeading = $headingBlock->propsData[0]->value;
        $attrs = " data-block-type=\"Heading\" data-block=\"{$headingBlock->id}\"";
        $this->assertStringContainsString("<h2{$attrs}>{$expectedPageBlockHeading}</h2>",
                                          $state->spyingResponse->getActualBody());
        $paragraphBlock = $state->testGlobalBlockTree[0];
        $expectedPageBlockHeading = $paragraphBlock->propsData[0]->value;
        $this->assertStringContainsString((new BlockTestUtils($this->pageTestUtils))->getExpectedParagraphBlockOutput($paragraphBlock),
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
        $expectedUrl = WebPageAwareTemplate::makeUrl("/public/test-suite-theme-generated.css");
        $html = $state->spyingResponse->getActualBody();
        $this->assertStringContainsString("<link href=\"{$expectedUrl}", $html);
        $registeredByTheme = WebPageAwareTemplate::makeUrl("/public/" . Theme::TEST_CSS_FILE_NAME);
        $automaticallyGenerated = "<link href=\"{$expectedUrl}";
        $this->assertGreaterThan(strpos($html, $registeredByTheme),
                                 strpos($html, $automaticallyGenerated));
    }
    private function verifyRenderedHead(\TestState $state): void {
        $retainEntities = \Closure::fromCallable([self::class, "escapeEntities"]);
        $dom = new Query($retainEntities($state->spyingResponse->getActualBody()));
        $ldJsonScriptEl = $dom->execute("head script[type=\"application/ld+json\"]")[0] ?? null;
        $this->assertNotNull($ldJsonScriptEl);
        $actualJdJson = json_decode($ldJsonScriptEl->nodeValue, flags: JSON_THROW_ON_ERROR);
        $ldWebPage = ArrayUtils::findByKey($actualJdJson->{"@graph"}, "WebPage", "@type");
        $expectedTitle = $retainEntities(Template::e($state->testPageData->title)) . " - Test suite website";
        $titleEl1 = $dom->execute("head title")[0] ?? null;
        $titleEl2 = $dom->execute("head meta[property=\"og:title\"]")[0] ?? null;
        $this->assertNotNull($titleEl1);
        $this->assertNotNull($titleEl2);
        $this->assertEquals($expectedTitle, $titleEl1->nodeValue);
        $this->assertEquals($expectedTitle, $titleEl2->getAttribute("content"));
        $this->assertEquals($expectedTitle, $ldWebPage->name);
        //
        $expectedDescr = $retainEntities(Template::e(json_decode($state->testPageData->meta)->description));
        $descrEl1 = $dom->execute("head meta[name=\"description\"]")[0] ?? null;
        $descrEl2 = $dom->execute("head meta[property=\"og:description\"]")[0] ?? null;
        $this->assertNotNull($descrEl1);
        $this->assertNotNull($descrEl2);
        $this->assertEquals($expectedDescr, $descrEl1->getAttribute("content"));
        $this->assertEquals($expectedDescr, $descrEl2->getAttribute("content"));
        $this->assertEquals($expectedDescr, $ldWebPage->description);
    }
    public static function escapeEntities(string $html): string {
        // \DomDocument likes to decode all html entities ("&gt;" -> ">") from the markup it parses.
        // We don't want that, because we often need to verify if some parts of markup are escaped or not.
        // So the fix is to convert all entities &gt; -> %gt; which \DomDocument can't tamper with
        return preg_replace("/&([#A-Za-z0-9]+);/", "%\$1;", $html);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderPageEscapesInlineStylesWhereRenderingPageInEditMode(): void {
        $state = $this->setupTest();
        $this->makeRenderPageTestApp($state);
        $this->insertTestGlobalBlocksToDb($state);
        $this->insertTestPageToDb($state);
        $this->sendRenderPageRequest($state, inEditMode: true);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyInjectedInlineStylesViaJavascript($state);
    }
    private function verifyInjectedInlineStylesViaJavascript(\TestState $state): void {
        $dom = new Query($state->spyingResponse->getActualBody());
        /** @var \DOMElement[] */
        $scriptEls = $dom->execute("head script") ?? [];
        $this->assertNotEmpty($scriptEls);
        $injectJs = $scriptEls[count($scriptEls) - 1]->nodeValue;
        $expectedBlockStyle1 = json_encode((object) [
            // see backend/sivujetti/tests/test-db-init.php (INSERT INTO themeBlockTypeStyles)
            "css" => base64_encode(ThemeCssFileUpdaterWriter::compileBlockTypeBaseCss((object) [
                "styles" => "{ padding: 4rem 2rem; }",
                "blockTypeName" => "Section",
            ])),
            "type" => "block-type",
            "id" => "Section",
        ]);
        $this->assertEquals(
            "document.head.appendChild([\n" .
                "[{$expectedBlockStyle1}],\n" .
                "[],\n" .
                "[],\n" .
            "].flat().reduce((out, {css, type, id}) => {\n" .
                "const bundle = document.createElement('style');\n" .
                "bundle.innerHTML = atob(css);\n" .
                "bundle.setAttribute(`data-styles-for-\${type}`, id);\n" .
                "out.appendChild(bundle);\n" .
                "return (out);\n" .
            "}, document.createDocumentFragment()))",
            $injectJs
        );
    }
}
