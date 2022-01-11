<?php declare(strict_types=1);

namespace Sivujetti\Tests\Upload;

use Sivujetti\Upload\{UploadsQFilters, UploadsRepository};

final class UploadImageTest extends UploadsControllerTestCase {
    private const TEST_FILE_NAME = "file.jpg";
    public function testUploadFileUploadsImage(): void {
        $state = $this->setupUploadImageTest();
        $this->makeTestSivujettiApp($state);
        $this->sendUploadImageRequest($state);
        $this->verifyMovedUploadedFileTo(SIVUJETTI_INDEX_PATH . "public/uploads/" . self::TEST_FILE_NAME,
                                         $state);
        $this->verifyInsertedFileToDb(self::TEST_FILE_NAME);
    }
    private function setupUploadImageTest(): \TestState {
        $state = new \TestState;
        $state->inputData = (object) ["fileName" => ""];
        $state->spyingResponse = null;
        return $state;
    }
    private function sendUploadImageRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest($this->createApiRequest(
            path: "/api/uploads",
            method: "POST",
            body: $state->inputData,
            files: (object) ["localFile" => [
                "name" => self::TEST_FILE_NAME,
                "tmp_name" => SIVUJETTI_BACKEND_PATH . "installer/sample-content/basic-site/\$index/public/uploads/sample.jpg",
                "error" => UPLOAD_ERR_OK,
                "size" => 1
            ]],
            serverVars: [
                "CONTENT_TYPE" => "multipart/form-data; boundary=----WebKitFormBoundary1234567890123456"
            ]
        ));
    }
    private function verifyMovedUploadedFileTo(string $expectedFilePath, \TestState $state): void {
        $this->assertEquals($expectedFilePath,
                            $state->actuallyMovedFileTo);
    }
    private function verifyInsertedFileToDb(string $expectedFileName): void {
        $actual = (new UploadsRepository(self::$db))
            ->getMany((new UploadsQFilters)->byMime("image/*"));
        $this->assertCount(1, $actual);
        $this->assertEquals($expectedFileName, $actual[0]->fileName);
        $this->assertEquals("", $actual[0]->baseDir);
        $this->assertEquals("image/jpeg", $actual[0]->mime);
        $this->assertEquals("", $actual[0]->friendlyName);
        $this->assertTrue($actual[0]->createdAt > time() - 10);
        $this->assertEquals(0, $actual[0]->updatedAt);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUploadFileUsesInputFileNameAsFileName(): void {
        $state = $this->setupUploadImageTest();
        $state->inputData->fileName = "myfile.png";
        $this->makeTestSivujettiApp($state);
        $this->sendUploadImageRequest($state);
        $base = SIVUJETTI_INDEX_PATH . "public/uploads/";
        $this->verifyMovedUploadedFileTo("{$base}{$state->inputData->fileName}", $state);
        $this->verifyInsertedFileToDb($state->inputData->fileName);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUploadFileRejectsInvalidInput(): void {
        $state = $this->setupUploadImageTest();
        $state->inputData->fileName = [];
        $this->makeTestSivujettiApp($state);
        $this->sendUploadImageRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "fileName must be string",
            "The length of fileName must be 255 or less",
            "The value of fileName did not pass the regexp"
        ], $state->spyingResponse);
    }
}
