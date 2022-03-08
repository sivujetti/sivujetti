<?php declare(strict_types=1);

namespace Sivujetti\Tests\PageType;

use Sivujetti\PageType\Entities\PageType;
use Sivujetti\PageType\PageTypesController;

final class CreatePageTypeTest extends PageTypesControllerTestCase {
    public function testCreatePageTypeInsertsNewPageTypeWithOwnFieldsToDb(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
        $this->sendCreatePageTypeRequest($state);
        $this->verifyRequestReturnedSuccesfully($state, 201);
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
    private function verifyCreatedPageTypeToDb(\TestState $state): void {
        $this->verifyPageTypeInDbEquals(PageTypesController::createEmptyPageTypeInput(), PageType::STATUS_DRAFT);
    }
}
