<?php declare(strict_types=1);

namespace Sivujetti\Tests\Block;

use Sivujetti\{SharedAPIContext, Template};
use Sivujetti\Block\Entities\Block;
use Sivujetti\Tests\Utils\{TestEnvBootstrapper};

final class RenderListingBlocksTest extends RenderBuiltInBlocksTestCase {
    protected const TEST_RENDERER_NAME = "listing-custom";
    protected const TEST_RENDERER_PATH = SIVUJETTI_SITE_PATH . "templates/" . self::TEST_RENDERER_NAME . ".tmpl.php";
    public static function setupBeforeClass(): void {
        parent::setUpBeforeClass();
        if (!is_file(self::TEST_RENDERER_PATH)) {
            $tmpl = "<article>" .
                "<?= \$this->e(\$props->filterPageType), \"-\", count(\$props->__pages)" .
                ", \"-\", \$props->__pages ? \$props->__pages[0]->title : \"nil\" ?>" .
            "</article>";
            file_put_contents(self::TEST_RENDERER_PATH, $tmpl);
        }
    }
    public static function tearDownAfterClass(): void {
        parent::tearDownAfterClass();
        if (is_file(self::TEST_RENDERER_PATH))
            unlink(self::TEST_RENDERER_PATH);
    }
    public function testListingBlockListsAllPages(): void {
        $state = $this->setupRenderListingBlocksTest();
        $this->makeTestSivujettiApp($state);
        $expectedHtml = (
            "<div class=\"j-Listing page-type-pages\" data-block-type=\"Listing\" data-block=\"{$state->testBlocks[0]->id}\">\r\n" .
                "    <p>No pages found.</p>\r\n<!-- children-start --><!-- children-placeholder --><!-- children-end -->" .
            "</div>"
        );
        $this->renderAndVerify($state, 0, $expectedHtml);
        //
        $this->insertTestPages($state);
        $fn = $state->makeExpectedHtml;
        $expectedHtml = $fn($state->testBlocks[0], $state->testPageData);
        $this->renderAndVerify($state, 0, $expectedHtml);
    }
    private function setupRenderListingBlocksTest(): \TestState {
        $state = parent::setupTest();
        $state->testPageData = $this->pageTestUtils->makeTestPageData();
        $state->testBlocks = [
            $this->blockTestUtils->makeBlockData(Block::TYPE_LISTING,
                renderer: "sivujetti:block-listing-pages-default",
                propsData: ["filterPageType" => "Pages",
                    "filterLimit" => 0,
                    "filterLimitType" => "all",
                    "filterOrder" => "desc",
                    "filterAdditional" => "{}"],
                id: "@auto"),
        ];
        $makeExpectedListItem = fn(object $pageData) =>
            "        <article class=\"list-item list-item-{$pageData->slug}\">\r\n" .
            "        <h2>".Template::e($pageData->title)."</h2>\r\n" .
            "        <div><a href=\"".Template::makeUrl($pageData->slug)."\">Read more</a></div>\r\n" .
            "    </article>\r\n";
        $state->makeExpectedHtml = fn(object $b, object $page1Data, object $page2Data = null) =>
            "<div class=\"j-Listing page-type-pages\" data-block-type=\"Listing\" data-block=\"{$b->id}\">\r\n" .
                ($makeExpectedListItem($page1Data)) .
                ($page2Data ? $makeExpectedListItem($page2Data) : "") .
            "    <!-- children-start --><!-- children-placeholder --><!-- children-end --></div>";
        return $state;
    }
    private function insertTestPages(\TestState $state): void {
        foreach (!is_array($state->testPageData) ? [$state->testPageData] : $state->testPageData as $pageData)
            $this->pageTestUtils->insertPage($pageData, $state->customPageType ?? null);
        if (isset($state->testCatData))
            $this->pageTestUtils->insertPage($state->testCatData, "PagesCategories");
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testListingBlockListsAllCustomPages(): void {
        $makeExpectedHtml = fn($pageCount, $firstPageTitle) =>
            "<article>MyProducts-{$pageCount}-{$firstPageTitle}</article>"
        ;
        $state = $this->setupRenderCustomListingBlocksTest();
        $this->registerCustomPageType($state);
        $this->makeTestSivujettiApp($state, function (TestEnvBootstrapper $bootModule) {
            $apiCtx = new SharedAPIContext;
            $apiCtx->blockRenderers[] = $this->blockTestUtils->createBlockRenderer(self::TEST_RENDERER_NAME, "MyProducts");
            $bootModule->useMock("apiCtx", [$apiCtx]);
        });
        //
        $expectedHtml = $makeExpectedHtml("0", "nil");
        $this->renderAndVerify($state, 0, $expectedHtml);
        //
        $this->insertTestPages($state);
        $expectedHtml = $makeExpectedHtml("1", "<Hellö>");
        $this->renderAndVerify($state, 0, $expectedHtml);
        $this->dropCustomPageType($state);
    }
    private function setupRenderCustomListingBlocksTest(): \TestState {
        $state = $this->setupRenderListingBlocksTest();
        $state->testPageData->ownField1 = "foo";
        $state->testPageData->ownField2 = 1;
        $state->testBlocks[0]->renderer = self::TEST_RENDERER_NAME;
        $this->blockTestUtils->setBlockProp($state->testBlocks[0], "filterPageType", "MyProducts");
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


    public function testListingBlockUsesLimitFilter(): void {
        $state = $this->setupRenderListingBlockHavingManyListItemsTest();
        $this->makeTestSivujettiApp($state);
        $this->insertTestPages($state);
        $fn = $state->makeExpectedHtml;
        //
        $expectedListItemsWithoutLimit = [$state->testPageData[1], $state->testPageData[0]];
        $expectedHtml = $fn($state->testBlocks[0], ...$expectedListItemsWithoutLimit);
        $this->renderAndVerify($state, 0, $expectedHtml);
        //
        $this->blockTestUtils->setBlockProp($state->testBlocks[0], "filterLimit", 1);
        $expectedListItemsWithLimit = [$state->testPageData[1]];
        $expectedHtml = $fn($state->testBlocks[0], ...$expectedListItemsWithLimit);
        $this->renderAndVerify($state, 0, $expectedHtml);
    }
    private function setupRenderListingBlockHavingManyListItemsTest(): \TestState {
        $state = $this->setupRenderListingBlocksTest();
        $page2 = clone $state->testPageData;
        $page2->id = str_replace("pp1", "pp2", $page2->id);
        $page2->slug = "/something-else";
        $page2->path = "something-else/";
        $page2->createdAt = $state->testPageData->createdAt + 10;
        $state->testPageData = [$state->testPageData, $page2];
        //
        $state->testCatData = $this->pageTestUtils->makeTestPageData(null, "PagesCategories", str_replace("pp2", "pp3", $page2->id));
        //
        return  $state;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testListingBlockUsesOrderFilter(): void {
        $state = $this->setupRenderListingBlockHavingManyListItemsTest();
        $this->makeTestSivujettiApp($state);
        $this->insertTestPages($state);
        $fn = $state->makeExpectedHtml;
        //
        $expectedListItemsWithDescendingOrderFilter = [$state->testPageData[1], $state->testPageData[0]];
        $expectedHtml = $fn($state->testBlocks[0], ...$expectedListItemsWithDescendingOrderFilter);
        $this->renderAndVerify($state, 0, $expectedHtml);
        //
        $this->blockTestUtils->setBlockProp($state->testBlocks[0], "filterOrder", "asc");
        $expectedListItemsWithAscendingOrderFilter = [$state->testPageData[0], $state->testPageData[1]];
        $expectedHtml = $fn($state->testBlocks[0], ...$expectedListItemsWithAscendingOrderFilter);
        $this->renderAndVerify($state, 0, $expectedHtml);
        //
        $this->blockTestUtils->setBlockProp($state->testBlocks[0], "filterOrder", "rand");
        $this->sendRenderBlockRequest($state, $state->testBlocks[0]);
        $this->verifyRequestFinishedSuccesfully($state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testListingBlockUsesUrlStartsWithFilter(): void {
        $state = $this->setupRenderListingBlockHavingManyListItemsTest();
        $this->makeTestSivujettiApp($state);
        $this->insertTestPages($state);
        $fn = $state->makeExpectedHtml;
        //
        $expectedListItemsWithoutFilter = [$state->testPageData[1], $state->testPageData[0]];
        $expectedHtml = $fn($state->testBlocks[0], ...$expectedListItemsWithoutFilter);
        $this->renderAndVerify($state, 0, $expectedHtml);
        //
        $f = json_encode(["p.slug" => ["\$startsWith" => "/hello"]]);
        $this->blockTestUtils->setBlockProp($state->testBlocks[0], "filterAdditional", $f);
        $expectedListItemsWithFilter = [$state->testPageData[0]];
        $expectedHtml = $fn($state->testBlocks[0], ...$expectedListItemsWithFilter);
        $this->renderAndVerify($state, 0, $expectedHtml);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testListingBlockUsesHasCategoryFilter(): void {
        $state = $this->setupRenderListingBlockHavingManyListItemsTest();
        $state->testPageData[0]->categories = [$state->testCatData->id];
        $this->makeTestSivujettiApp($state);
        $this->insertTestPages($state);
        $fn = $state->makeExpectedHtml;
        //
        $expectedListItemsWithoutFilter = [$state->testPageData[1], $state->testPageData[0]];
        $expectedHtml = $fn($state->testBlocks[0], ...$expectedListItemsWithoutFilter);
        $this->renderAndVerify($state, 0, $expectedHtml);
        //
        $f = json_encode(["p.categories" => ["\$contains" => "\"{$state->testCatData->id}\""]]);
        $this->blockTestUtils->setBlockProp($state->testBlocks[0], "filterAdditional", $f);
        $expectedListItemsWithLimit = [$state->testPageData[0]];
        $expectedHtml = $fn($state->testBlocks[0], ...$expectedListItemsWithLimit);
        $this->renderAndVerify($state, 0, $expectedHtml);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testListingBlockUsesMultipleFilters(): void {
        $state = $this->setupRenderListingBlockHavingManyListItemsTest();
        $page3 = clone $state->testPageData[0];
        $page3->id = str_replace("pp1", "pp3", $page3->id);
        $page3->slug = "/yet-another-page";
        $page3->path = "yet-another-page/";
        $state->testPageData[] = $page3;
        //
        $state->testPageData[0]->categories = [$state->testCatData->id];
        $state->testPageData[1]->categories = [$state->testCatData->id];
        $this->makeTestSivujettiApp($state);
        $this->insertTestPages($state);
        $fn = $state->makeExpectedHtml;
        //
        $f1v = ["\$contains" => "\"{$state->testCatData->id}\""];
        $f1 = json_encode(["p.categories" => $f1v]);
        $this->blockTestUtils->setBlockProp($state->testBlocks[0], "filterAdditional", $f1);
        $expectedListItemsWithSingleFilter = [$state->testPageData[1], $state->testPageData[0]];
        $expectedHtml = $fn($state->testBlocks[0], ...$expectedListItemsWithSingleFilter);
        $this->renderAndVerify($state, 0, $expectedHtml);
        //
        $f2 = json_encode(["p.categories" => $f1v,
                           "p.slug" => ["\$startsWith" => "/hello"]]);
        $this->blockTestUtils->setBlockProp($state->testBlocks[0], "filterAdditional", $f2);
        $expectedListItemsWithBothFilters = [$state->testPageData[0]];
        $expectedHtml = $fn($state->testBlocks[0], ...$expectedListItemsWithBothFilters);
        $this->renderAndVerify($state, 0, $expectedHtml);
    }
}
