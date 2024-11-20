<?php declare(strict_types=1);

namespace Sivujetti\Tests\Update;

use Sivujetti\Update\Updater;

final class BeginUpdateTest extends UpdateTestCase {
    public function testBeginUpdatesStartTheUpdateProcess(): void {
        $state = $this->setupTest();
        $this->makeUpdateTestApp($state);
        $this->sendBeginUpdateRequest($state);
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
        $this->verifyMarkedUpdatesAsStarted($state);
    }
    private function sendBeginUpdateRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/updates/begin", "PUT"));
    }
    private function verifyMarkedUpdatesAsStarted(\TestState $state): void {
        $job = self::$db->fetchOne("SELECT * FROM `\${p}jobs` WHERE `jobName` = ?", ["updates:all"]);
        $this->assertGreaterThanOrEqual(time() - 10, $job["startedAt"]);
    }


    /////////////////////////////////////////////////////////////////////////////


    public function testBeginUpdatesRejectsRequestIfUpdateWasAlreadyInProgress(): void {
        $state = $this->setupTest();
        $this->makeUpdateTestApp($state);
        $this->simulateUpdateIsAlreadyStartedByAnotherRequest($state);
        $this->sendBeginUpdateRequest($state);
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals((object) ["ok" => "ok", "detailsCode" => Updater::RESULT_ALREADY_IN_PROGRESS],
                                        $state->spyingResponse);
    }
    private function simulateUpdateIsAlreadyStartedByAnotherRequest(\TestState $state): void {
        self::$db->exec("UPDATE `\${p}jobs` SET `startedAt` = ? WHERE `jobName` = ?",
                        [time(), "updates:all"]);
    }
}
