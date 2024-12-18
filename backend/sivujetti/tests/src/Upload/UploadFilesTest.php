<?php declare(strict_types=1);

namespace Sivujetti\Tests\Upload;

use Sivujetti\Auth\ACL;
use Sivujetti\Upload\Entities\UploadsEntry;

final class UploadFilesTest extends UploadsControllerTestCase {
    private const MOCK_UPLOADED_FILE_NAME = "SourceSansPro-Semibold-lettersOnly.ttf";
    private const MOCK_UPLOADED_FILE_PATH = SIVUJETTI_BACKEND_PATH . "sivujetti/tests/assets/" . self::MOCK_UPLOADED_FILE_NAME;
    public function testUploadFileUploadsImage(): void {
        $state = $this->setupUploadFileTest();
        $this->makeSivujettiAppForUploadsTest($state);
        $this->sendUploadImageRequest($state);
        $this->verifyMovedUploadedFileTo(SIVUJETTI_INDEX_PATH . "public/uploads/gradient-background.jpg", $state);
        $this->verifyInsertedFileToDb($state->inputData);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUploadFileUsesInputFileNameAsFileName(): void {
        $state = $this->setupUploadFileTest();
        $state->inputData->targetFileName = "my-file.jpg";
        $this->makeSivujettiAppForUploadsTest($state);
        $this->sendUploadImageRequest($state);
        $base = SIVUJETTI_INDEX_PATH . "public/uploads/";
        $this->verifyMovedUploadedFileTo("{$base}{$state->inputData->targetFileName}", $state);
        $this->verifyInsertedFileToDb($state->inputData);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUploadFileRejectsInvalidInput(): void {
        $state = $this->setupUploadFileTest();
        $state->inputData->targetFileName = [];
        $state->inputData->friendlyName = [];
        $this->makeSivujettiAppForUploadsTest($state);
        $this->sendUploadImageRequest($state);
        $this->verifyResponseMetaEquals(400, "application/json", $state->spyingResponse);
        $this->verifyResponseBodyEquals([
            "targetFileName must be string",
            "The length of targetFileName must be 255 or less",
            "The value of targetFileName did not pass the regexp",
            "friendlyName must be string",
            "The length of friendlyName must be 255 or less",
        ], $state->spyingResponse);
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUploadFileEnumeratesDuplicateFilePath(): void {
        $state = $this->setupUploadFileTest();
        $state->inputData->targetFileName = "file.jpg";
        $this->makeSivujettiAppForUploadsTest($state, addTheseToPreviouslyUploadedFiles: ["file.jpg"]);
        $this->sendUploadImageRequest($state);
        $base = SIVUJETTI_INDEX_PATH . "public/uploads/";
        $this->verifyMovedUploadedFileTo("{$base}file-1.jpg", $state);
        $this->verifyInsertedFileToDb($state->inputData, "file-1.jpg");
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUploadFileEnumeratesDuplicateFilePath2(): void {
        $state = $this->setupUploadFileTest();
        $state->inputData->targetFileName = "my-file.jpg";
        $this->makeSivujettiAppForUploadsTest($state, addTheseToPreviouslyUploadedFiles: ["my-file.jpg"]);
        $this->sendUploadImageRequest($state);
        $base = SIVUJETTI_INDEX_PATH . "public/uploads/";
        $this->verifyMovedUploadedFileTo("{$base}my-file-1.jpg", $state);
        $this->verifyInsertedFileToDb($state->inputData, "my-file-1.jpg");
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUploadFileEnumeratesDuplicateFilePath3(): void {
        $state = $this->setupUploadFileTest();
        $state->inputData->targetFileName = "my-file-1.jpg";
        $this->makeSivujettiAppForUploadsTest($state, addTheseToPreviouslyUploadedFiles: ["my-file-1.jpg"]);
        $this->sendUploadImageRequest($state);
        $base = SIVUJETTI_INDEX_PATH . "public/uploads/";
        $this->verifyMovedUploadedFileTo("{$base}my-file-1-1.jpg", $state);
        $this->verifyInsertedFileToDb($state->inputData, "my-file-1-1.jpg");
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUploadFileEnumeratesDuplicateFilePath4(): void {
        $state = $this->setupUploadFileTest();
        $state->inputData->targetFileName = "my-file.jpg";
        $this->makeSivujettiAppForUploadsTest($state, addTheseToPreviouslyUploadedFiles: ["my-file.jpg", "my-file-1.jpg"]);
        $this->sendUploadImageRequest($state);
        $base = SIVUJETTI_INDEX_PATH . "public/uploads/";
        $this->verifyMovedUploadedFileTo("{$base}my-file-2.jpg", $state);
        $this->verifyInsertedFileToDb($state->inputData, "my-file-2.jpg");
    }


    ////////////////////////////////////////////////////////////////////////////


    public function testUploadFileFailsIsInputFileTypeIsNotInUsersAllowedMimeList(): void {
        $state = $this->setupUploadFileTest();
        $this->makeSivujettiAppForUploadsTest($state, ACL::ROLE_EDITOR);
        $this->expectExceptionMessage("You aren't permitted to upload this type of file");
        $this->sendUploadImageRequest($state, self::MOCK_UPLOADED_FILE_NAME, self::MOCK_UPLOADED_FILE_PATH);
    }
    private function setupUploadFileTest(): \TestState {
        $state = new \TestState;
        $state->inputData = (object) ["targetFileName" => "gradient-background.jpg", "friendlyName" => "sample"];
        $state->spyingResponse = null;
        return $state;
    }
    private function sendUploadImageRequest(\TestState $state,
                                            string $realInputFileName = "gradient-background.jpg",
                                            ?string $realInputFilePath = null): void {
        $state->spyingResponse = $state->app->sendRequest($this->createApiRequest(
            path: "/api/uploads",
            method: "POST",
            body: $state->inputData,
            files: (object) ["localFile" => [
                "name" => $realInputFileName,
                "tmp_name" => $realInputFilePath ?? SIVUJETTI_BACKEND_PATH . "installer/sample-content/minimal/\$index/public/uploads/{$realInputFileName}",
                "error" => UPLOAD_ERR_OK,
                "size" => 1
            ]],
            serverVars: [
                "CONTENT_TYPE" => "multipart/form-data; boundary=----WebKitFormBoundary1234567890123456"
            ]
        ));
    }
    private function verifyMovedUploadedFileTo(string $expectedFilePath, \TestState $state): void {
        $this->assertEquals($expectedFilePath, $state->actuallyMovedFileTo);
    }
    private function verifyInsertedFileToDb(object $input, string $expectedFinalFileName = null): void {
        $actual = self::$db->fetchOne("SELECT * FROM `\${p}files` WHERE createdAt>?", [0], \PDO::FETCH_CLASS, UploadsEntry::class);
        $this->assertTrue($actual instanceof UploadsEntry);
        $this->assertEquals($expectedFinalFileName ?? $input->targetFileName, $actual->fileName);
        $this->assertEquals("", $actual->baseDir);
        $this->assertEquals("image/jpeg", $actual->mime);
        $this->assertEquals($input->friendlyName, $actual->friendlyName);
        $this->assertTrue($actual->updatedAt > time() - 10);
        $this->assertEquals($actual->createdAt, $actual->updatedAt);
    }
}
