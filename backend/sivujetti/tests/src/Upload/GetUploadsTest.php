<?php declare(strict_types=1);

namespace Sivujetti\Tests\Upload;

final class GetUploadsTest extends UploadsControllerTestCase {
    public function testGetUploadsReturnsOnlyImagesSortedByNewestToOldest(): void {
        $state = $this->setupListUploadsTest();
        $this->dbDataHelper->insertData($state->testFiles, "files");
        $this->makeSivujettiAppForUploadsTest($state);
        $this->sendGetUploadsRequest($state, "images");
        $onlyImagesOldestToNewest = array_slice($state->testFiles, 0, 2);
        $this->verifyListedTheseFiles(array_reverse($onlyImagesOldestToNewest), $state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testGetUploadsReturnsOnlyFiles(): void {
        $state = $this->setupListUploadsTest();
        $this->dbDataHelper->insertData($state->testFiles, "files");
        $this->makeSivujettiAppForUploadsTest($state);
        $this->sendGetUploadsRequest($state, "files");
        $this->verifyListedTheseFiles(array_slice($state->testFiles, 2), $state);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testGetUploadsWithFileNameFilterReturnsOnlyMatchingFiles(): void {
        $state = $this->setupListUploadsTest();
        $this->dbDataHelper->insertData($state->testFiles, "files");
        $this->makeSivujettiAppForUploadsTest($state);
        $this->sendGetUploadsRequest($state, "images", "cat");
        $this->verifyListedTheseFiles(array_slice($state->testFiles, 0, 1), $state);
        $this->sendGetUploadsRequest($state, "images", "Everdeen");
        $this->verifyListedTheseFiles([$state->testFiles[1]], $state);
        $this->sendGetUploadsRequest($state, "files", "foo");
        $this->verifyListedTheseFiles([], $state);
    }
    private function setupListUploadsTest(): \TestState {
        $state = new \TestState;
        $state->testFiles = $this->createSampleFiles();
        $state->spyingResponse = null;
        return $state;
    }
    private function sendGetUploadsRequest(\TestState $state,
                                           ?string $fileTypeFilter = null,
                                           ?string $fileNameFilter = null): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest(sprintf("/api/uploads%s%s",
                !$fileTypeFilter ? "" : "/{$fileTypeFilter}",
                !$fileNameFilter ? "" : "/{$fileNameFilter}"
            ), "GET"));
    }
    private function verifyListedTheseFiles(array $expected, \TestState $state): void {
        $makeExpectedResponseItem = fn($testItem) => (object) [
            "id" => $testItem->id,
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
