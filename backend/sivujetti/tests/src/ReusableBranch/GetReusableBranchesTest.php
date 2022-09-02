<?php declare(strict_types=1);

namespace Sivujetti\Tests\ReusableBranch;

use Sivujetti\JsonUtils;

final class GetReusableBranchesTest extends ReusableBranchesControllerTestCase {
    public function testListReusableBranchesReturnsAllReusableBranchesFromDb(): void {
        $state = $this->setupTest();
        $this->insertTestReusableBranchToDb($state->testReusableBranch);
        $this->insertTestReusableBranchToDb($state->testReusableBranch2);
        $this->makeTestSivujettiApp($state);
        $this->sendListReusableBranchesRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyListedAllReusableBranches($state);
    }
    protected function setupTest(): \TestState {
        $state = parent::setupTest();
        $state->testReusableBranch2 = json_decode(json_encode($state->testReusableBranch));
        $state->testReusableBranch2->id[-1] = "2";
        return $state;
    }
    private function sendListReusableBranchesRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/reusable-branches", "GET"));
    }
    private function verifyListedAllReusableBranches(\TestState $state): void {
        $actual = json_decode($state->spyingResponse->getActualBody(), flags: JSON_THROW_ON_ERROR);
        $this->assertCount(2, $actual);
        usort($actual, fn($a, $b) => $a->id[-1] <=> $b->id[-1]);
        $this->assertEquals(JsonUtils::parse($state->testReusableBranch->blockBlueprints), $actual[0]->blockBlueprints);
        $this->assertEquals(JsonUtils::parse($state->testReusableBranch2->blockBlueprints), $actual[1]->blockBlueprints);
    }
}
