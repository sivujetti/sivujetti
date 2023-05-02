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
        $this->verifyReturnedPagesFromDb($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->testPageData1 = $this->pageTestUtils->makeTestPageData();
        $state->testPageData2 = $this->pageTestUtils->makeTestPageData();
        $state->testPageData2->id = str_replace("pp1", "pp2", $state->testPageData1->id);
        $state->testPageData2->slug .= str_replace("ello", "ello2", $state->testPageData2->slug);
        $state->testPageData2->path .= str_replace("ello", "ello2", $state->testPageData2->path);
        $state->testPageData2->title .= str_replace("ello", "ello2", $state->testPageData2->title);
        $state->testPageData2->meta = new \stdClass;
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    private function sendListPagesRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest($this->createApiRequest(
            "/api/pages/" . PageType::PAGE, "GET"));
    }
    private function verifyReturnedPagesFromDb(\TestState $state): void {
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
        $actualPages = json_decode($state->spyingResponse->getActualBody(), flags: JSON_THROW_ON_ERROR);
        $this->assertCount(2, $actualPages);
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
        $this->assertEquals($makeExpected($state->testPageData2), $actualPages[0]);
        $this->assertEquals($makeExpected($state->testPageData1), $actualPages[1]);
    }
}
