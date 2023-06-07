<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use Sivujetti\PageType\Entities\PageType;

final class DeletePageTest extends PagesControllerTestCase {
    public function testDeletePageDeletesDataFromDb(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
        $this->insertTestPageDataToDb($state);
        $this->assertNotNull($this->pageTestUtils->getPageById($state->testPageData->id));
        $this->sendDeletePageRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyDeletedPageFromDb($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->testPageData = $this->pageTestUtils->makeTestPageData();
        $state->testPageData->slug = "/delete-page-test-page";
        $state->testPageData->path = "/delete-page-test-page/";
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    private function sendDeletePageRequest(\TestState $state, string $pageTypeName = PageType::PAGE): void {
        $req = $this->createApiRequest("/api/pages/{$pageTypeName}{$state->testPageData->slug}", "DELETE");
        $state->spyingResponse = $state->app->sendRequest($req);
    }
    private function verifyDeletedPageFromDb(\TestState $state, ?PageType $pageType = null): void {
        $actual = $this->pageTestUtils->getPageById($state->testPageData->id, $pageType);
        $this->assertNull($actual);
    }
}
