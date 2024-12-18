<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use Sivujetti\Block\Entities\Block;
use Sivujetti\PageType\Entities\PageType;
use Pike\PikeException;
use Sivujetti\Block\BlockTree;
use Sivujetti\Tests\Utils\PageTestUtils;

final class UpdatePageTest extends PagesControllerTestCase {
    public function testUpdatePageWritesUpdatedDataToDb(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
        $catId = $this->insertTestCatToDb($state);
        $state->inputData->categories[0] = $catId;
        $this->insertTestPageDataToDb($state);
        $this->sendUpdatePageRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyWroteDefaultFieldsToDb($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->testPageData = $this->pageTestUtils->makeTestPageData();
        $state->testPageData->slug = "/update-page-test-page";
        $state->testPageData->path = "/update-page-test-page/";
        $state->testPageData->layoutId .= "2";
        //
        $state->testCatData = $this->pageTestUtils->makeTestPageData(null, "PagesCategories",
            str_replace("pp1", "pp2", $state->testPageData->id));
        //
        $state->inputData = (object) [
            "slug" => "/updated-update-page-test-page-slug",
            "path" => "/updated-update-page-test-page-slug/",
            "level" => "1",
            "title" => "Updated update page test page title",
            "meta" => (object) [
                "description" => $state->testPageData->meta->description,
                "junk" => "data",
            ],
            "layoutId" => $state->testPageData->layoutId,
            "status" => $state->testPageData->status + 1,
            "categories" => [],
        ];
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    private function insertTestCatToDb(\TestState $state): string {
        $this->insertTestPageDataToDb($state->testCatData, "PagesCategories");
        return $state->testCatData->id;
    }
    private function sendUpdatePageRequest(\TestState $state, string $pageTypeName = PageType::PAGE): void {
        $state->spyingResponse = $state->app->sendRequest($this->createApiRequest(
            "/api/pages/{$pageTypeName}/{$state->testPageData->id}",
            "PUT",
            $state->inputData));
    }
    private function verifyWroteDefaultFieldsToDb(\TestState $state, ?PageType $pageType = null): void {
        $actual = $this->pageTestUtils->getPageById($state->testPageData->id,
                                                    $pageType);
        $this->assertEquals($state->inputData->slug, $actual->slug);
        $this->assertEquals($state->inputData->path, $actual->path);
        $this->assertEquals((int) $state->inputData->level, $actual->level);
        $this->assertEquals($state->inputData->title, $actual->title);
        $this->assertEquals(PageTestUtils::createCleanMetaFromInput($state->inputData->meta),
                            $actual->meta);
        $this->assertEquals($state->inputData->layoutId, $actual->layoutId);
        $this->assertEquals((int) $state->inputData->status, $actual->status);
        $this->assertEquals($state->testPageData->createdAt, $actual->createdAt);
        $this->assertTrue($actual->lastUpdatedAt >= $state->testPageData->lastUpdatedAt);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdatePageRejectsInvalidInputs(): void {
        $state = $this->setupTest();
        $state->inputData = (object) ["meta" => (object) ["description" => ["not-a-string"]]];
        $this->makeTestSivujettiApp($state);
        $this->insertTestPageDataToDb($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage(implode("\n", [
            "slug is not valid",
            "path must be string",
            "title must be string",
            "level must be number",
            "meta.description must be string",
            "The length of meta.description must be 300 or less",
            "layoutId must be number",
            "The value of layoutId must be 1 or greater",
            "status must be number",
            "The value of status must be 0 or greater",
            "categories must be array",
        ]));
        $this->sendUpdatePageRequest($state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdatePageRejectsInvalidInputs2(): void {
        $state = $this->setupTest();
        $state->inputData = (object) [
            "slug" => "foo.com",
            "meta" => (object) ["socialImage" => (object) ["mime" => new \stdClass]]
        ];
        $this->makeTestSivujettiApp($state);
        $this->insertTestPageDataToDb($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessageMatches(
            "/" .
            ".+" .
            "meta\.socialImage\.src must be string.+" .
            "Expected meta\.socialImage\.src not to contain the value.+" .
            "The length of meta\.socialImage\.mime must be 128 or less.+" .
            "meta\.socialImage\.width must be int.+" .
            "meta\.socialImage\.height must be int.+" .
            "/s"
        );
        $this->sendUpdatePageRequest($state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdatePageDoesNotUpdateIdOrBlocks(): void {
        $state = $this->setupTest();
        $state->inputData->id = "-ppppppppppppppppppp";
        $state->inputData->blocks = BlockTree::toJson([$state->testPageData->blocks[0]->children[0]]);
        $this->makeTestSivujettiApp($state);
        $this->insertTestPageDataToDb($state);
        $this->sendUpdatePageRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyDidNotUpdateIdOrBlocksToDb($state);
    }
    private function verifyDidNotUpdateIdOrBlocksToDb(\TestState $state): void {
        $actual = $this->pageTestUtils->getPageById($state->testPageData->id);
        $original = $state->testPageData;
        $this->assertEquals($original->id, $actual->id);
        $this->assertEquals(array_map([Block::class, "fromObject"], $original->blocks),
                            $actual->blocks);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdateCustomPageWritesUpdatedDataToDb(): void {
        $state = $this->setupUpdateCustomPageTest();
        $state->customPageType = $this->pageTestUtils->registerTestCustomPageType();
        $this->makeTestSivujettiApp($state);
        $this->insertTestPageDataToDb($state, $state->customPageType);
        $this->sendUpdatePageRequest($state, $state->customPageType->name);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyWroteDefaultFieldsToDb($state, $state->customPageType);
        $this->verifyWroteCustomPagesOwnFieldsToDb($state);
        $this->onTearDown = fn() => $this->pageTestUtils->dropCustomPageType($state->customPageType);
    }
    private function setupUpdateCustomPageTest(): \TestState {
        $state = $this->setupTest();
        unset($state->testPageData->categories);
        $state->testPageData->ownField1 = "Value original";
        $state->testPageData->ownField2 = 123;
        $state->inputData->ownField1 = "Updated value";
        $state->inputData->ownField2 = 456;
        $state->customPageType = null;
        return $state;
    }
    private function verifyWroteCustomPagesOwnFieldsToDb(\TestState $state): void {
        $actual = $this->pageTestUtils->getPageById($state->testPageData->id,
                                                    $state->customPageType);
        $this->assertEquals($state->inputData->ownField1, $actual->ownField1);
        $this->assertEquals((int) $state->inputData->ownField2, $actual->ownField2);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdateCustomPageRejectsInvalidOwnFieldsInputs(): void {
        $state = $this->setupUpdateCustomPageTest();
        $state->customPageType = $this->pageTestUtils->registerTestCustomPageType();
        $state->inputData = (object) [];
        $this->makeTestSivujettiApp($state);
        $this->insertTestPageDataToDb($state, $state->customPageType);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage(implode("\n", [
            "ownField1 must be string",
            "The length of ownField1 must be 1024 or less",
            "ownField2 must be number",
            "The value of ownField2 must be 0 or greater",
        ]));
        $this->sendUpdatePageRequest($state, $state->customPageType->name);
        $this->onTearDown = fn() => $this->pageTestUtils->dropCustomPageType($state->customPageType);
    }
}
