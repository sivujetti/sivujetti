<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use Sivujetti\PageType\Entities\PageType;

final class ListPagesTest extends PagesControllerTestCase {
    public function testListPagesReturnsListOfPages(): void {
        $state = $this->setupTest();
        $this->insertTestPageDataToDb($state->testPageData1);
        $this->insertTestPageDataToDb($state->testPageData2);
        $this->makeTestSivujettiApp($state);
        $this->sendListPagesRequest($state);
        $this->verifyReturnedPagesFromDb($state, [$state->testPageData2, $state->testPageData1]);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->testPageData1 = $this->pageTestUtils->makeTestPageData();
        $state->testPageData1->createdAt -= 10;
        $state->testPageData2 = $this->pageTestUtils->makeTestPageData();
        $state->testPageData2->id = str_replace("pp1", "pp2", $state->testPageData1->id);
        $state->testPageData2->slug = str_replace("hello", "bello", $state->testPageData2->slug);
        $state->testPageData2->path = str_replace("hello", "bello", $state->testPageData2->path);
        $state->testPageData2->title = str_replace("Hello", "Bello", $state->testPageData2->title);
        $state->testPageData2->meta = new \stdClass;
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    private function sendListPagesRequest(\TestState $state, ?string $searchTerm = ""): void {
        $state->spyingResponse = $state->app->sendRequest($this->createApiRequest(
            "/api/pages/" . PageType::PAGE,
            "GET",
            queryVars: !$searchTerm ? null : ["searchTerm" => $searchTerm]
        ));
    }
    private function verifyReturnedPagesFromDb(\TestState $state, array $expectedPages): void {
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
        $actualPages = json_decode($state->spyingResponse->getActualBody(), flags: JSON_THROW_ON_ERROR);
        $this->assertCount(count($expectedPages), $actualPages);
        $makeExpected = fn($p) => (object) [
            "id" => $p->id,
            "slug" => $p->slug,
            "path" => $p->path,
            "level" => $p->level,
            "title" => $p->title,
            "layoutId" => $p->layoutId,
            "blocks" => [],
            "status" => $p->status,
            "type" => "Pages",
            "meta" => (object) array_merge(
                (array) $p->meta,
                ["socialImage" => $p->meta->socialImage ?? null]
            )
        ];
        $this->assertEquals(array_map($makeExpected, $expectedPages), $actualPages);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testListPagesWithSearchTermReturnsFilteredPages(): void {
        $state = $this->setupTest();
        $this->insertTestPageDataToDb($state->testPageData1);
        $this->insertTestPageDataToDb($state->testPageData2);
        $this->makeTestSivujettiApp($state);
        //
        $this->sendListPagesRequest($state, "Bel");
        $this->verifyReturnedPagesFromDb($state, [$state->testPageData2]);
        //
        $this->sendListPagesRequest($state, "bel");
        $this->verifyReturnedPagesFromDb($state, [$state->testPageData2]);
    }
}
