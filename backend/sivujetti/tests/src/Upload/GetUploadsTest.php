<?php declare(strict_types=1);

namespace Sivujetti\Tests\Upload;

final class GetUploadsTest extends UploadsControllerTestCase {
    public function testGetUploadsReturnsOnlyImages(): void {
        $state = $this->setupListUploadsTest();
        $this->dbDataHelper->insertData($state->testFiles, "files");
        $this->makeSivujettiAppForUploadsTest($state);
        $this->sendGetUploadsRequest($state, '{"mime":{"$eq":"image/*"}}');
        $this->verifyListedTheseFiles(array_slice($state->testFiles, 0, 2), $state);
    }
    private function setupListUploadsTest(): \TestState {
        $state = new \TestState;
        $state->testFiles = [
            (object) ["fileName" => "a-cat.png",
                      "baseDir" => "sub-dir/",
                      "mime" => "image/png",
                      "friendlyName" => "",
                      "createdAt" => "1320969601",
                      "updatedAt" => "0"],
            (object) ["fileName" => "niss.jpg",
                      "baseDir" => "sub-dir/",
                      "mime" => "image/jpeg",
                      "friendlyName" => "Everdeen",
                      "createdAt" => "1320969601",
                      "updatedAt" => "0"],
            (object) ["fileName" => "readme.txt",
                      "baseDir" => "",
                      "mime" => "text/plain",
                      "friendlyName" => "",
                      "createdAt" => "1320969601",
                      "updatedAt" => "0"]
        ];
        $state->spyingResponse = null;
        return $state;
    }
    private function sendGetUploadsRequest(\TestState $state, ?string $filters = null): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/uploads" . (!$filters ? "" : "/{$filters}"), "GET"));
    }
    private function verifyListedTheseFiles(array $expected, \TestState $state): void {
        $makeExpectedResponseItem = fn($testItem) => (object) [
            "fileName" => $testItem->fileName,
            "baseDir" => $testItem->baseDir,
            "mime" => $testItem->mime,
            "friendlyName" => $testItem->friendlyName ?: "",
            "createdAt" => (int) $testItem->createdAt,
            "updatedAt" => (int) $testItem->updatedAt,
        ];
        $this->verifyRespondedSuccesfullyWith(
            array_map($makeExpectedResponseItem, $expected),
            $state);
    }
    private function verifyRespondedSuccesfullyWith($expected, \TestState $state): void {
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals($expected, $state->spyingResponse);
    }
}
