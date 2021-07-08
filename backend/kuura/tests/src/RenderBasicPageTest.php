<?php declare(strict_types=1);

namespace KuuraCms\Tests;

use KuuraCms\App;
use KuuraCms\Block\Entities\Block;
use KuuraCms\Page\SiteAwareTemplate;
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
        $this->sendRenderPageRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyRenderedCorrectPageAndLayout($state);
        $this->verifyThemeCanRegisterCssFiles($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->app = null;
        $state->testPageBlocksTree = [self::makeBlockData(Block::TYPE_SECTION, "Main", "kuura:block-generic-wrapper", children: [
            self::makeBlockData(Block::TYPE_HEADING, ownProps: ["text" => "Hello", "level" => 2]),
            self::makeBlockData(Block::TYPE_PARAGRAPH, ownProps: ["text" => "Text"]),
        ], ownProps: ["cssClass" => "", "bgImage" => ""])];
        $state->testPageData = (object) [
            "slug" => "/hello",
            "path" => "/hello",
            "level" => 1,
            "title" => "<Hello>",
            "layoutId" => 1,
            "blocks" => json_encode($state->testPageBlocksTree,
                JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),
            "categories" => "[]",
        ];
        return $state;
    }
    private function insertTestPageToDb(\TestState $state): void {
        $this->pageTestUtils->insertPage($state->testPageData);
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
        $expectedPageBlockHeading = $state->testPageBlocksTree[0]->children[0]->props[0]->value;
        $this->assertStringContainsString("<h2>{$expectedPageBlockHeading}</h2>",
                                          $state->spyingResponse->getActualBody());
    }
    private function verifyThemeCanRegisterCssFiles(\TestState $state): void {
        $expectedUrl = SiteAwareTemplate::makeUrl("/public/basic-site.css");
        $this->assertStringContainsString("<link href=\"{$expectedUrl}\" rel=\"stylesheet\">",
            $state->spyingResponse->getActualBody());
    }
    private static function makeBlockData(?string $type = null,
                                          ?string $title = null,
                                          ?string $renderer = null,
                                          ?array $children = null,
                                          ?array $ownProps = null): object {
        $out = new \stdClass;
        $out->type = $type ?? Block::TYPE_PARAGRAPH;
        $out->title = $title ?? "";
        $out->renderer = $renderer ?? "kuura:block-auto";
        $out->id = "-aaaaaaaaaaaaaaaaaaa";
        $out->children = $children ?? [];
        foreach ($ownProps as $key => $value) {
            $out->props[] = (object) ["key" => $key, "value" => $value];
        }
        return $out;
    }
}
