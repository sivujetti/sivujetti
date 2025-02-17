<?php declare(strict_types=1);

namespace Sivujetti\Tests\Upload;

final class DeleteEntryTest extends UploadsControllerTestCase {
    public function testDeleteFileDeletesFileFromDatabaseAndDisk(): void {
        $state = $this->setupDeleteEntryTest();
        $this->dbDataHelper->insertData($state->testFiles, "files");
        $this->makeSivujettiAppForUploadsTest($state);
        $this->sendDeleteFileRequest($state);
        $this->verifyResponseMetaEquals(200, "application/json", $state->spyingResponse);
        $this->verifyDeletedFileFromDb($state);
        $this->verifyDeletedFileFromDisk($state);
    }
    private function setupDeleteEntryTest(): \TestState {
        $state = new \TestState;
        $state->testFiles = [(object) [
            ...((array) $this->createSampleFiles()[0]),
            "baseDir" => "",
        ]];
        $state->spyingResponse = null;
        return $state;
    }
    private function sendDeleteFileRequest(\TestState $state): void {
        $fileNameDec = urlencode($state->testFiles[0]->fileName);
        $baseDirDec = "-";
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/uploads/{$fileNameDec}/{$baseDirDec}", "DELETE"));
    }
    private function verifyDeletedFileFromDb(\TestState $state): void {
        $actual = $this->dbDataHelper->getRow("files",
                                              "fileName = ?",
                                              [$state->testFiles[0]->fileName]);
        $this->assertNull($actual);
    }
    private function verifyDeletedFileFromDisk(\TestState $state): void {
        $this->assertEquals(SIVUJETTI_INDEX_PATH . "public/uploads/" . $state->testFiles[0]->fileName,
                            $state->actuallyDeletedFilePath);
    }
}
