<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use DiDom\Document;
use MySite\Theme;
use Pike\ArrayUtils;
use Sivujetti\Auth\ACL;
use Sivujetti\Block\BlockTree;
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\GlobalBlockReferenceBlockType;
use Sivujetti\Page\Entities\Page;
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
        $state = $this->createTestStateStub();
        $btu = new BlockTestUtils();
        $state->testGlobalBlockTree = [
            $btu->makeBlockData(Block::TYPE_TEXT, id: "@auto", propsData: ["html" => "<p>Footer text</p>"])
        ];
        $state->testGlobalBlockData = (object) [
            "id" => "1",
            "name" => "Footer",
            "blocks" => BlockTree::toJson($state->testGlobalBlockTree),
        ];
        $state->testPageData->createdAt = time();
        $state->testPageData->lastUpdatedAt = $state->testPageData->createdAt;
        $state->testPageData->blocks[] = $btu->makeBlockData(Block::TYPE_GLOBAL_BLOCK_REF,
            propsData: ["globalBlockTreeId" => $state->testGlobalBlockData->id, "overrides" =>
                GlobalBlockReferenceBlockType::EMPTY_OVERRIDES, "useOverrides" => 0]
        );
        return $state;
    }
    private function insertTestGlobalBlocksToDb(\TestState $state): void {
        $this->dbDataHelper->insertData((object) ["id" => $state->testGlobalBlockData->id,
                                                  "name" => $state->testGlobalBlockData->name,
                                                  "blocks" => $state->testGlobalBlockData->blocks],
                                        "globalBlockTrees");
    }
    private function verifyRenderedCorrectPageAndLayout(\TestState $state): void {
        $actualHeadingTextBlockHtml = $state->testPageData->blocks[0]->children[0];
        $expected1 = (new BlockTestUtils($this->pageTestUtils))->getExpectedTextBlockOutput($actualHeadingTextBlockHtml, childHtml: "");
        $this->assertStringContainsString($expected1, $state->spyingResponse->getActualBody());

        $actualParagrapTextBlockHtml = $state->testGlobalBlockTree[0];
        $expected2 = (new BlockTestUtils($this->pageTestUtils))->getExpectedTextBlockOutput($actualParagrapTextBlockHtml, childHtml: "");
        $this->assertStringContainsString($expected2, $state->spyingResponse->getActualBody());
    }
    private function verifyThemeCanRegisterCssFiles(\TestState $state): void {
        $expectedUrl = self::makeUrl("/public/" . Theme::TEST_CSS_FILE_NAME, false) . "?v=abcdefg1";
        $this->assertStringContainsString("<link href=\"{$expectedUrl}\" rel=\"stylesheet\">",
            $state->spyingResponse->getActualBody());
    }
    private function verifyRenderedBlockTypeBaseStyles(\TestState $state): void {
        $expectedUrl = self::makeUrl("/public/test-suite-theme-generated.css", false);
        $html = $state->spyingResponse->getActualBody();
        $this->assertStringContainsString("<link href=\"{$expectedUrl}", $html);
        $registeredByTheme = self::makeUrl("/public/" . Theme::TEST_CSS_FILE_NAME, false);
        $automaticallyGenerated = "<link href=\"{$expectedUrl}";
        $this->assertTrue(strpos($html, $automaticallyGenerated) > strpos($html, $registeredByTheme));
    }
    private function verifyRenderedHead(\TestState $state): void {
        $retainEntities = \Closure::fromCallable([self::class, "escapeEntities"]);
        $retainUmlauts = fn($str) => str_replace("ö", "%ou", str_replace("ä", "%au", $str));
        $retained1 = $retainEntities($state->spyingResponse->getActualBody());
        $dom = new Document($retainUmlauts($retained1));
        $ldJsonScriptEl = $dom->first("head script[type=\"application/ld+json\"]");
        $this->assertNotNull($ldJsonScriptEl);
        $this->assertStringNotContainsString("\\/", $ldJsonScriptEl->text(), "ld+json should not contain escaped backslashes");
        $this->assertStringNotContainsString("\\u0", $ldJsonScriptEl->text(), "ld+json should not contain escaped unicode points");
        $actualJdJson = json_decode(self::withEscapedBackslashes($ldJsonScriptEl->text()), flags: JSON_THROW_ON_ERROR);
        $ldWebPage = ArrayUtils::findByKey($actualJdJson->{"@graph"}, "WebPage", "@type");
        $ldWebSite = ArrayUtils::findByKey($actualJdJson->{"@graph"}, "WebSite", "@type");
        // ld+json general
        $expectedSiteUrlFull = "http://localhost{$this->makeUrl("/", withIndexFile: false)}";
        $this->assertEquals($expectedSiteUrlFull, $ldWebSite->url);
        $this->assertEquals("{$expectedSiteUrlFull}#website", $ldWebSite->{"@id"});
        $this->assertEquals((object) ["@id" => $ldWebSite->{"@id"}], $ldWebPage->isPartOf);
        // Title
        $expectedTitle = $retainUmlauts($retainEntities(Template::e($state->testPageData->title)) .
                                                        " - Test suitö website xss %gt;");
        $titleEl1 = $dom->first("head title");
        $titleEl2 = $dom->first("head meta[property=\"og:title\"]");
        $this->assertNotNull($titleEl1);
        $this->assertNotNull($titleEl2);
        $this->assertEquals($expectedTitle, $titleEl1->getNode()->nodeValue);
        $this->assertEquals($expectedTitle, $titleEl2->getAttribute("content"));
        $this->assertEquals($expectedTitle, $ldWebPage->name);
        // Type
        $typeEl = $dom->first("head meta[property=\"og:type\"]");
        $this->assertNotNull($typeEl);
        $this->assertEquals("website", $typeEl->getAttribute("content"));
        // Description
        $expectedDescr = $retainEntities(Template::e($state->testPageData->meta->description));
        $descrEl1 = $dom->first("head meta[name=\"description\"]");
        $descrEl2 = $dom->first("head meta[property=\"og:description\"]");
        $this->assertNotNull($descrEl1);
        $this->assertNotNull($descrEl2);
        $this->assertEquals($expectedDescr, $descrEl1->getAttribute("content"));
        $this->assertEquals($expectedDescr, $descrEl2->getAttribute("content"));
        $this->assertEquals($expectedDescr, $ldWebPage->description);
        // Locale
        $localeEl = $dom->first("head meta[property=\"og:locale\"]");
        $this->assertNotNull($localeEl);
        $this->assertEquals("fi_FI", $localeEl->getAttribute("content"));
        $this->assertEquals("fi", $ldWebSite->inLanguage);
        $this->assertEquals("fi", $ldWebPage->inLanguage);
        // Permalink
        $expectedPageUrlFull = "http://localhost" . rtrim(self::makeUrl($state->testPageData->path), "/");
        $permaEl1 = $dom->first("head link[rel=\"canonical\"]");
        $permaEl2 = $dom->first("head meta[property=\"og:url\"]");
        $this->assertNotNull($permaEl1);
        $this->assertNotNull($permaEl2);
        $this->assertEquals($expectedPageUrlFull, $permaEl1->getAttribute("href"));
        $this->assertEquals($expectedPageUrlFull, $permaEl2->getAttribute("content"));
        $this->assertEquals($expectedPageUrlFull, $ldWebPage->url);
        $this->assertEquals("{$expectedPageUrlFull}#webpage", $ldWebPage->{"@id"});
        $this->assertEquals((object) ["@type" => "ReadAction", "target" => [$expectedPageUrlFull]],
                            $ldWebPage->potentialAction[0]);
        // Published at + Last modified at
        $lastModEl = $dom->first("head meta[property=\"article:modified_time\"]");
        $this->assertNotNull($lastModEl);
        $this->assertEquals(date("Y-m-d\TH:i:sP", $state->testPageData->lastUpdatedAt), $lastModEl->getAttribute("content"));
        $this->assertEquals(date("Y-m-d\TH:i:sP", $state->testPageData->createdAt), $ldWebPage->datePublished);
        $this->assertEquals(date("Y-m-d\TH:i:sP", $state->testPageData->lastUpdatedAt), $ldWebPage->dateModified);
        // Site name + description
        $siteNameEl = $dom->first("head meta[property=\"og:site_name\"]");
        $expectedSiteName = $retainUmlauts("Test suitö website xss %gt;");
        $this->assertEquals($expectedSiteName, $siteNameEl->getAttribute("content"));
        $this->assertEquals($expectedSiteName, $ldWebSite->name);
        $this->assertEquals("xss %gt;", $ldWebSite->description);
        // Social image
        $input = $state->testPageData->meta->socialImage;
        $imgUrlEl = $dom->first("head meta[property=\"og:image\"]");
        $expectedImgUrl = "http://localhost" . self::makeUrl("/public/uploads/{$input->src}", false);
        $this->assertEquals($expectedImgUrl, $imgUrlEl->getAttribute("content"));
        $imgWidthEl = $dom->first("head meta[property=\"og:image:width\"]");
        $this->assertEquals($input->width, $imgWidthEl->getAttribute("content"));
        $imgHeightEl = $dom->first("head meta[property=\"og:image:height\"]");
        $this->assertEquals($input->height, $imgHeightEl->getAttribute("content"));
        $imgTypeEl = $dom->first("head meta[property=\"og:image:type\"]");
        $this->assertEquals($input->mime, $imgTypeEl->getAttribute("content"));
        $twtCardTypeEl = $dom->first("head meta[name=\"twitter:card\"]");
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
        $dom = new Document($state->spyingResponse->getActualBody());
        $scriptEls = $dom->find("head script");
        $this->assertNotEmpty($scriptEls);
        $injectJs = $scriptEls[count($scriptEls) - 1]->text();
        $orderStyles = fn($styles) => [$styles[1], $styles[0]];
        $expectedStyles = json_encode(array_map(fn($itm) => (object) [
            "css" => ThemesController::combineAndWrapCss(json_decode($itm->units), $itm->blockTypeName),
            "blockTypeName" => $itm->blockTypeName,
        ], $orderStyles($ts)), JSON_UNESCAPED_UNICODE);
        $this->assertEquals(
        "(function () {\n" .
        "    const {head} = document;\n" .
        "    head.appendChild(createStyleEl(\"\", 'edit-app-all'));\n" .
        "    head.appendChild(createStyleEl(\"\", 'all'));\n" .
        "    head.appendChild(createStyleEl('', 'fast-all'));\n" .
        "    \n" .
        "    function createStyleEl(css, scopeId) {\n" .
        "        const styleEl = document.createElement('style');\n" .
        "        styleEl.innerHTML = css;\n" .
        "        styleEl.setAttribute('data-scope', scopeId);\n" .
        "        return styleEl;\n" .
        "    }\n" .
        "})();",
            $injectJs
        );
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testRenderPageNotRenderPageDraftsIfUserIsNotLoggedIn(): void {
        $state = $this->setupVisibilityTest();
        $this->insertTestPageToDb($state);

        $this->makePagesControllerTestApp($state, loggedInUserRole: ACL::ROLE_CONTRIBUTOR);
        $this->sendRenderPageRequest($state);
        $this->verifyRequestFinishedSuccesfully($state, withStatusCode: 404, withContentType: "text/html");

        $this->makePagesControllerTestApp($state, loggedInUserRole: ACL::ROLE_AUTHOR);
        $this->sendRenderPageRequest($state);
        $this->verifyRequestFinishedSuccesfully($state, withStatusCode: 200, withContentType: "text/html");
    }
    private function setupVisibilityTest(): \TestState {
        $state = $this->createTestStateStub();
        $state->testPageData->status = Page::STATUS_DRAFT;
        return $state;
    }
    private function createTestStateStub(): \TestState {
        $state = new \TestState;
        $state->testPageData = $this->pageTestUtils->makeTestPageData();
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
}
