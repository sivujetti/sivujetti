<?php declare(strict_types=1);

namespace Sivujetti\Upload;

use Pike\{PikeException, Request, Response, Validation};

final class UploadsController {
    /**
     * GET /api/uploads/:filters?: Returns a list of files synced to db
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Upload\UploadsRepository $uploadsRepo
     */
    public function getUploads(Request $req,
                               Response $res,
                               UploadsRepository $uploadsRepo): void {
        if ($req->params->filters !== '{"mime":{"$eq":"image/*"}}')
            throw new \RuntimeException("Not implemented");
        $files = $uploadsRepo->getMany((new UploadsQFilters)->byMime("image/*"));
        $res->json($files);
    }
    /**
     * POST /api/uploads: validates incoming file $_FILES["localFile"], moves it
     * to the uploads directory and inserts to db.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Upload\Uploader $uploader
     * @param \Sivujetti\Upload\UploadsRepository $uploadsRepo
     */
    public function uploadFile(Request $req,
                               Response $res,
                               Uploader $uploader,
                               UploadsRepository $uploadsRepo): void {
        if (!isset($req->files->localFile["error"]) ||
            $req->files->localFile["error"] !== UPLOAD_ERR_OK) {
            throw new PikeException("Expected UPLOAD_ERR_OK (0), but got " .
                                    isset($req->files->localFile["error"])
                                        ? $req->files->localFile["error"]
                                        : "<nothing>",
                                    PikeException::FAILED_FS_OP);
        } elseif (($errors = self::validateUploadInput($req->body))) {
            $res->status(400)->json($errors);
            return;
        }
        // @allow \Pike\PikeException
        $file = $uploader->upload($req->files->localFile,
                                  SIVUJETTI_INDEX_PATH . "public/uploads",
                                  $req->body->fileName);
        $file->friendlyName = "";
        $file->createdAt = time();
        // $file->updatedAt Use database default
        // @allow \Pike\PikeException
        $insertId = $uploadsRepo->insert($file);
        //
        $res->json(["file" => $insertId !== "" ? $file : null]);
    }
    /**
     * @param object $input
     * @return string[] Error messages or []
     */
    private static function validateUploadInput(object $input): array {
        return Validation::makeObjectValidator()
            ->rule("fileName", "type", "string")
            ->rule("fileName", "maxLength", 255)
            ->rule("fileName", "regexp", "/^[^\/]*$/") // sub-directories not supported yet
            ->validate($input);
    }
}
