<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use Sivujetti\BlockType\{BlockTypeInterface, PropertiesBuilder};
use Sivujetti\Tests\Utils\BlockTestUtils;
use Sivujetti\UserSite\UserSiteAPI;

final class RenderPageWithCustomBlockTest extends RenderPageTestCase {
    private const TEST_RENDERER_FILEID = "site:quote";
    private const TEST_RENDERER_FILEPATH = SIVUJETTI_BACKEND_PATH . "site/templates/quote.tmpl.php";
    public static function setupBeforeClass(): void {
        parent::setUpBeforeClass();
        if (!is_file(self::TEST_RENDERER_FILEPATH))
            file_put_contents(self::TEST_RENDERER_FILEPATH,
                              "<blockquote><?= \$this->e(\$props->quote) ?></blockquote>");
    }
    public static function tearDownAfterClass(): void {
        parent::tearDownAfterClass();
        if (is_file(self::TEST_RENDERER_FILEPATH))
            unlink(self::TEST_RENDERER_FILEPATH);
    }
    public function testRenderPageRendersCustomBlock(): void {
        $state = $this->setupTest();
        $this->registerCustomBlock($state);
        $this->makeSivujettiApp($state);
        $this->insertTestPageToDb($state);
        $this->sendRenderPageRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyRenderedCustomBlock($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->testPageData = $this->pageTestUtils->makeTestPageData([]);
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    private function registerCustomBlock(\TestState $state): void {
        $api = new UserSiteAPI("site", $this->testAppStorage);
        $api->registerBlockRenderer(self::TEST_RENDERER_FILEID);
        $api->registerBlockType("Quote", new class implements BlockTypeInterface {
            public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
                return $builder
                    ->newProperty("quote", $builder::DATA_TYPE_TEXT)
                    ->getResult();
            }
        });
        //
        $btu = new BlockTestUtils();
        $state->testPageData->blocks = [
            $btu->makeBlockData("Quote",
                                renderer: self::TEST_RENDERER_FILEID,
                                propsData: ["quote" => "<Hello>"])
        ];
    }
    private function verifyRenderedCustomBlock(\TestState $state): void {
        $expectedQuote = htmlspecialchars($state->testPageData->blocks[0]->propsData[0]->value);
        $this->assertStringContainsString("<blockquote>{$expectedQuote}</blockquote>",
                                          $state->spyingResponse->getActualBody());
    }
}
