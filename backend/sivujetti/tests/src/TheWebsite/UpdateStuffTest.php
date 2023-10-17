<?php declare(strict_types=1);

namespace Sivujetti\Tests\TheWebsite;

final class UpdateStuffTest extends TheWebsiteControllerTestCase {
    public function testUpdateTheWebsitesBasicInfoOverwritesDataToDb(): void {
        $state = $this->setupUpdateBasicInfoTest();
        $this->makeTestSivujettiApp($state);
        $this->sendUpdateTheWebsitesBasicInfoRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyWroteBasicInfoToDb($state);
    }
    protected function setupUpdateBasicInfoTest(): \TestState {
        $state = parent::setupTest();
        //
        $state->originalData = $this->dbDataHelper->getRow("theWebsite");
        //
        $state->inputData = (object) [
            "name" => "Updated name",
            "lang" => "en",
            "country" => "US",
            "description" => "Updated description.",
            "hideFromSearchEngines" => false,
        ];
        //
        return $state;
    }
    private function sendUpdateTheWebsitesBasicInfoRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/the-website/basic-info",
                "PUT", $state->inputData));
    }
    private function verifyWroteBasicInfoToDb(\TestState $state): void {
        $actual = $this->dbDataHelper->getRow("theWebsite");
        $this->assertEquals($state->inputData->name, $actual["name"]);
        $this->assertEquals($state->inputData->lang, $actual["lang"]);
        $this->assertEquals($state->inputData->country, $actual["country"]);
        $this->assertEquals($state->inputData->description, $actual["description"]);
        $this->assertEquals($state->inputData->hideFromSearchEngines, (bool) $actual["hideFromSearchEngines"]);
        foreach (["aclRules", "firstRuns", "versionId", "lastUpdatedAt", "latestPackagesLastCheckedAt",
                  "pendingUpdates", "headHtml", "footHtml"] as $col)
            $this->assertEquals($state->originalData[$col], $actual[$col], "Shouldn't update {$col}");
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdateTheWebsitesBasicInfoValidatesInputData(): void {
        $state = $this->setupBasicInfoValidationTest();
        $this->makeTestSivujettiApp($state);
        $this->sendUpdateTheWebsitesBasicInfoRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "The length of name must be at least 1",
            "The length of name must be 92 or less",
            "lang must be string",
            "The value of lang did not pass the regexp",
            "country must be string",
            "The value of country did not pass the regexp",
            "The length of description must be 1024 or less",
            "hideFromSearchEngines must be bool",
        ], $state->spyingResponse);
    }
    protected function setupBasicInfoValidationTest(): \TestState {
        $state = parent::setupTest();
        $state->inputData = (object) ["description" => ["not-a-string"]];
        return $state;
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdateTheWebsitesGlobalScriptsOverwritesDataToDb(): void {
        $state = $this->setupUpdateGlobalScriptsTest();
        $this->makeTestSivujettiApp($state);
        $this->sendUpdateTheWebsitesGlobalScriptsRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyWroteGlobalScriptsToDb($state);
    }
    protected function setupUpdateGlobalScriptsTest(): \TestState {
        $state = parent::setupTest();
        //
        $state->originalData = $this->dbDataHelper->getRow("theWebsite");
        //
        $state->inputData = (object) [
            "headHtml" => "<script src=\"https://foo.com/analytics.js\"></script>",
            "footHtml" => "<script src=\"https://bar.com/analytics.js\" data-foo=\"baz\"></script>",
        ];
        //
        return $state;
    }
    private function sendUpdateTheWebsitesGlobalScriptsRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/the-website/global-scripts",
                "PUT", $state->inputData));
    }
    private function verifyWroteGlobalScriptsToDb(\TestState $state): void {
        $actual = $this->dbDataHelper->getRow("theWebsite");
        $this->assertEquals($state->inputData->headHtml, $actual["headHtml"]);
        $this->assertEquals($state->inputData->footHtml, $actual["footHtml"]);
        foreach (["name", "lang", "country", "description", "aclRules", "firstRuns", "versionId",
                  "lastUpdatedAt", "latestPackagesLastCheckedAt"] as $col)
            $this->assertEquals($state->originalData[$col], $actual[$col], "Shouldn't update {$col}");
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdateTheWebsitesGlobalScriptsValidatesInputData(): void {
        $state = $this->setupGlobalScriptsValidationTest();
        $this->makeTestSivujettiApp($state);
        $this->sendUpdateTheWebsitesGlobalScriptsRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "headHtml must be string",
            "The length of headHtml must be 128000 or less",
            "footHtml must be string",
            "The length of footHtml must be 128000 or less",
        ], $state->spyingResponse);
    }
    protected function setupGlobalScriptsValidationTest(): \TestState {
        $state = parent::setupTest();
        $state->inputData = (object) ["headHtml" => ["not-a-string"], "footHtml" => ["not-a-string"]];
        return $state;
    }
}
