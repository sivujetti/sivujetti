<?php declare(strict_types=1);

namespace Sivujetti\Tests\TheWebsite;

final class UpdateBasicInfoTest extends TheWebsiteControllerTestCase {
    public function testUpdateTheWebsitesBasicInfoOverwritesDataToDb(): void {
        $state = $this->setupTest();
        $this->makeTestSivujettiApp($state);
        $this->sendUpdateTheWebsitesBasicInfoRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyWroteDataToDb($state);
    }
    protected function setupTest(): \TestState {
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
    private function verifyWroteDataToDb(\TestState $state): void {
        $actual = $this->dbDataHelper->getRow("theWebsite");
        $this->assertEquals($state->inputData->name, $actual["name"]);
        $this->assertEquals($state->inputData->lang, $actual["lang"]);
        $this->assertEquals($state->inputData->country, $actual["country"]);
        $this->assertEquals($state->inputData->description, $actual["description"]);
        $this->assertEquals($state->inputData->hideFromSearchEngines, (bool) $actual["hideFromSearchEngines"]);
        foreach (["aclRules", "firstRuns", "versionId", "lastUpdatedAt", "newestCoreVersionLastChecked"] as $col)
            $this->assertEquals($state->originalData[$col], $actual[$col], "Shouldn't update {$col}");
        $this->assertEquals("","");
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUpdateTheWebsitesBasicInfoValidatesInputData(): void {
        $state = $this->setupValidationTest();
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
    protected function setupValidationTest(): \TestState {
        $state = parent::setupTest();
        $state->inputData = (object) ["description" => ["not-a-string"]];
        return $state;
    }
}
