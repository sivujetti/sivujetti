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
use Sivujetti\Tests\Utils\{BlockTestUtils, TestData};
use Sivujetti\Theme\ThemesController;

final class RenderBasicPageTest extends RenderPageTestCase {
    public function testRenderPageRendersPage(): void {
        $state = $this->setupTest();
        $this->makePagesControllerTestApp($state);
        $this->insertTestGlobalBlocksToDb($state);
        $this->insertTestPageToDb($state);
        $this->sendRenderPageRequest($state);
        $this->verifyRequestFinishedSuccesfully($state, withContentType: "text/html");
        $this->verifyRenderedCorrectPageAndLayout($state);
        $this->verifyThemeCanRegisterCssFiles($state);
        $this->verifyRenderedBlockTypeBaseStyles($state);
        $this->verifyRenderedHead($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $btu = new BlockTestUtils();
        $state->testGlobalBlockTree = [
            $btu->makeBlockData(Block::TYPE_PARAGRAPH, id: "@auto", propsData: ["text" => "Footer text"])
        ];
        $state->testGlobalBlockData = (object) [
            "id" => "1",
            "name" => "Footer",
            "blocks" => BlockTree::toJson($state->testGlobalBlockTree),
        ];
        $state->testPageData = $this->pageTestUtils->makeTestPageData();
        $state->testPageData->createdAt = time();
        $state->testPageData->lastUpdatedAt = $state->testPageData->createdAt;
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
                                        "globalBlockTrees");
    }
    private function verifyRenderedCorrectPageAndLayout(\TestState $state): void {
        $headingBlock = $state->testPageData->blocks[0]->children[0];
        $expectedPageBlockHeading = $headingBlock->propsData[0]->value;
        $this->assertStringContainsString("<h2 class=\"j-Heading\" data-block-type=\"Heading\" data-block=\"{$headingBlock->id}\">{$expectedPageBlockHeading}<!-- children-start --><!-- children-end --></h2>",
                                          $state->spyingResponse->getActualBody());
        $paragraphBlock = $state->testGlobalBlockTree[0];
        $expectedPageBlockHeading = $paragraphBlock->propsData[0]->value;
        $this->assertStringContainsString((new BlockTestUtils($this->pageTestUtils))->getExpectedParagraphBlockOutput($paragraphBlock),
                                          $state->spyingResponse->getActualBody());
    }
    private function verifyThemeCanRegisterCssFiles(\TestState $state): void {
        $expectedUrl = WebPageAwareTemplate::makeUrl("/public/" . Theme::TEST_CSS_FILE_NAME, false);
        $this->assertStringContainsString("<link href=\"{$expectedUrl}\" rel=\"stylesheet\">",
            $state->spyingResponse->getActualBody());
    }
    private function verifyRenderedBlockTypeBaseStyles(\TestState $state): void {
        $expectedUrl = WebPageAwareTemplate::makeUrl("/public/test-suite-theme-generated.css", false);
        $html = $state->spyingResponse->getActualBody();
        $this->assertStringContainsString("<link href=\"{$expectedUrl}", $html);
        $registeredByTheme = WebPageAwareTemplate::makeUrl("/public/" . Theme::TEST_CSS_FILE_NAME, false);
        $automaticallyGenerated = "<link href=\"{$expectedUrl}";
        $this->assertGreaterThan(strpos($html, $registeredByTheme),
                                 strpos($html, $automaticallyGenerated));
    }
    private function verifyRenderedHead(\TestState $state): void {
        $retainEntities = \Closure::fromCallable([self::class, "escapeEntities"]);
        $dom = new Query($retainEntities($state->spyingResponse->getActualBody()));
        $ldJsonScriptEl = $dom->execute("head script[type=\"application/ld+json\"]")[0] ?? null;
        $this->assertNotNull($ldJsonScriptEl);
        $this->assertStringNotContainsString("\\/", $ldJsonScriptEl->nodeValue, "ld+json should not contain escaped backslashes");
        $this->assertStringNotContainsString("\\u0", $ldJsonScriptEl->nodeValue, "ld+json should not contain escaped unicode points");
        $actualJdJson = json_decode(self::withEscapedBackslashes($ldJsonScriptEl->nodeValue), flags: JSON_THROW_ON_ERROR);
        $ldWebPage = ArrayUtils::findByKey($actualJdJson->{"@graph"}, "WebPage", "@type");
        $ldWebSite = ArrayUtils::findByKey($actualJdJson->{"@graph"}, "WebSite", "@type");
        // ld+json general
        $expectedSiteUrlFull = "http://localhost" . Template::makeUrl("/", withIndexFile: false);
        $this->assertEquals($expectedSiteUrlFull, $ldWebSite->url);
        $this->assertEquals("{$expectedSiteUrlFull}#website", $ldWebSite->{"@id"});
        $this->assertEquals((object) ["@id" => $ldWebSite->{"@id"}], $ldWebPage->isPartOf);
        // Title
        $expectedTitle = $retainEntities(Template::e($state->testPageData->title)) . " - Test suitö website xss %gt;";
        $titleEl1 = $dom->execute("head title")[0] ?? null;
        $titleEl2 = $dom->execute("head meta[property=\"og:title\"]")[0] ?? null;
        $this->assertNotNull($titleEl1);
        $this->assertNotNull($titleEl2);
        $this->assertEquals($expectedTitle, $titleEl1->nodeValue);
        $this->assertEquals($expectedTitle, $titleEl2->getAttribute("content"));
        $this->assertEquals($expectedTitle, $ldWebPage->name);
        // Description
        $expectedDescr = $retainEntities(Template::e($state->testPageData->meta->description));
        $descrEl1 = $dom->execute("head meta[name=\"description\"]")[0] ?? null;
        $descrEl2 = $dom->execute("head meta[property=\"og:description\"]")[0] ?? null;
        $this->assertNotNull($descrEl1);
        $this->assertNotNull($descrEl2);
        $this->assertEquals($expectedDescr, $descrEl1->getAttribute("content"));
        $this->assertEquals($expectedDescr, $descrEl2->getAttribute("content"));
        $this->assertEquals($expectedDescr, $ldWebPage->description);
        // Locale
        $localeEl = $dom->execute("head meta[property=\"og:locale\"]")[0] ?? null;
        $this->assertNotNull($localeEl);
        $this->assertEquals("fi_FI", $localeEl->getAttribute("content"));
        $this->assertEquals("fi", $ldWebSite->inLanguage);
        $this->assertEquals("fi", $ldWebPage->inLanguage);
        // Permalink
        $expectedPageUrlFull = "http://localhost" . rtrim(Template::makeUrl($state->testPageData->path), "/");
        $permaEl1 = $dom->execute("head link[rel=\"canonical\"]")[0] ?? null;
        $permaEl2 = $dom->execute("head meta[property=\"og:url\"]")[0] ?? null;
        $this->assertNotNull($permaEl1);
        $this->assertNotNull($permaEl2);
        $this->assertEquals($expectedPageUrlFull, $permaEl1->getAttribute("href"));
        $this->assertEquals($expectedPageUrlFull, $permaEl2->getAttribute("content"));
        $this->assertEquals($expectedPageUrlFull, $ldWebPage->url);
        $this->assertEquals("{$expectedPageUrlFull}#webpage", $ldWebPage->{"@id"});
        $this->assertEquals((object) ["@type" => "ReadAction", "target" => [$expectedPageUrlFull]],
                            $ldWebPage->potentialAction[0]);
        // Published at + Last modified at
        $lastModEl = $dom->execute("head meta[property=\"article:modified_time\"]")[0] ?? null;
        $this->assertNotNull($lastModEl);
        $this->assertEquals(date("Y-m-d\TH:i:sP", $state->testPageData->lastUpdatedAt), $lastModEl->getAttribute("content"));
        $this->assertEquals(date("Y-m-d\TH:i:sP", $state->testPageData->createdAt), $ldWebPage->datePublished);
        $this->assertEquals(date("Y-m-d\TH:i:sP", $state->testPageData->lastUpdatedAt), $ldWebPage->dateModified);
        // Site name + description
        $siteNameEl = $dom->execute("head meta[property=\"og:site_name\"]")[0] ?? null;
        $expectedSiteName = "Test suitö website xss %gt;";
        $this->assertEquals($expectedSiteName, $siteNameEl->getAttribute("content"));
        $this->assertEquals($expectedSiteName, $ldWebSite->name);
        $this->assertEquals("xss %gt;", $ldWebSite->description);
        // Social image
        $input = $state->testPageData->meta->socialImage;
        $imgUrlEl = $dom->execute("head meta[property=\"og:image\"]")[0] ?? null;
        $expectedImgUrl = "http://localhost" . WebPageAwareTemplate::makeUrl("/public/uploads/{$input->src}", false);
        $this->assertEquals($expectedImgUrl, $imgUrlEl->getAttribute("content"));
        $imgWidthEl = $dom->execute("head meta[property=\"og:image:width\"]")[0] ?? null;
        $this->assertEquals($input->width, $imgWidthEl->getAttribute("content"));
        $imgHeightEl = $dom->execute("head meta[property=\"og:image:height\"]")[0] ?? null;
        $this->assertEquals($input->height, $imgHeightEl->getAttribute("content"));
        $imgTypeEl = $dom->execute("head meta[property=\"og:image:type\"]")[0] ?? null;
        $this->assertEquals($input->mime, $imgTypeEl->getAttribute("content"));
        $twtCardTypeEl = $dom->execute("head meta[name=\"twitter:card\"]")[0] ?? null;
        $this->assertEquals("summary_large_image", $twtCardTypeEl->getAttribute("content"));
        $ldImage = ArrayUtils::findByKey($actualJdJson->{"@graph"}, "ImageObject", "@type");
        $this->assertEquals("{$expectedSiteUrlFull}#primaryimage", $ldImage->{"@id"});
        $this->assertEquals("fi", $ldImage->inLanguage);
        $this->assertEquals($expectedImgUrl, $ldImage->url);
        $this->assertEquals($expectedImgUrl, $ldImage->contentUrl);
        $this->assertEquals($input->width, $ldImage->width);
        $this->assertEquals($input->height, $ldImage->height);
        $this->assertEquals((object) ["@id" => $ldImage->{"@id"}], $ldWebPage->primaryImageOfPage);
    }
    public static function escapeEntities(string $html): string {
        // \DomDocument likes to decode all html entities ("&gt;" -> ">") from the markup it parses.
        // We don't want that, because we often need to verify that some parts of the markup are
        // escaped. The fix: convert all entities &gt; -> %gt; which \DomDocument can't tamper with
        return preg_replace("/&([#A-Za-z0-9]+);/", "%\$1;", $html);
    }
    private static function withEscapedBackslashes(string $str): string {
        return str_replace("/", "\\/", $str);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderPageEscapesInlineStylesWhereRenderingPageInEditMode(): void {
        $state = $this->setupTest();
        $this->makePagesControllerTestApp($state);
        $this->insertTestGlobalBlocksToDb($state);
        $this->insertTestPageToDb($state);
        $this->sendRenderPageRequest($state, inEditMode: true);
        $this->verifyRequestFinishedSuccesfully($state, withContentType: "text/html");
        $this->verifyInjectedThemeStylesViaJavascript($state);
    }
    private function verifyInjectedThemeStylesViaJavascript(\TestState $state): void {
        $ts = TestData::getThemeStyles();
        $dom = new Query($state->spyingResponse->getActualBody());
        /** @var \DOMElement[] */
        $scriptEls = $dom->execute("head script") ?? [];
        $this->assertNotEmpty($scriptEls);
        $injectJs = $scriptEls[count($scriptEls) - 1]->nodeValue;
        $orderStyles = fn($styles) => [$styles[1], $styles[0]];
        $expectedStyles = json_encode(array_map(fn($itm) => (object) [
            "css" => ThemesController::combineAndWrapCss(json_decode($itm->units), $itm->blockTypeName),
            "blockTypeName" => $itm->blockTypeName,
        ], $orderStyles($ts)), JSON_UNESCAPED_UNICODE);
        $this->assertEquals(
            "document.head.appendChild({$expectedStyles}.reduce((out, {css, blockTypeName}) => {\n" .
            "  const bundle = document.createElement('style');\n" .
            "  bundle.innerHTML = css;\n" .
            "  bundle.setAttribute('data-style-units-for', blockTypeName);\n" .
            "  out.appendChild(bundle);\n" .
            "  return out;\n" .
            "}, document.createDocumentFragment()))",
            $injectJs
        );
    }
}
