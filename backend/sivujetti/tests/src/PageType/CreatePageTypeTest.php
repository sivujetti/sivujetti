<?php declare(strict_types=1);

namespace Sivujetti\Tests\PageType;

use Sivujetti\PageType\Entities\PageType;
use Sivujetti\PageType\PageTypesController;

final class CreatePageTypeTest extends PageTypeControllerTestCase {
    public function testCreatePageTypeInsertsNewPageTypeWithOwnFieldsToDb(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
        $this->sendCreatePageTypeRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyCreatedPageTypeToDb($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    private function sendCreatePageTypeRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/page-types/as-placeholder", "POST"));
    }
    private function verifyRequestFinishedSuccesfully(\TestState $state): void {
        $this->verifyResponseMetaEquals(201, "application/json", $state->spyingResponse);
    }
    private function verifyCreatedPageTypeToDb(\TestState $state): void {
        $this->verifyPageTypeInDbEquals(PageTypesController::createEmptyPageTypeInput(), PageType::STATUS_DRAFT);
    }
}
