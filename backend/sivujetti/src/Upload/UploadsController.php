<?php declare(strict_types=1);

namespace Sivujetti\Upload;

use Pike\{PikeException, Request, Response, Validation};
use Pike\Db\FluentDb;
use Sivujetti\Auth\ACL;

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
        $files = match (urldecode($req->params->filters)) {
            '{"mime":{"$eq":"image/*"}}' => $uploadsRepo->getMany((new UploadsQFilters)->byMime("image/*")),
            '{"mime":{"$neq":"image/*"}}' => $uploadsRepo->getMany((new UploadsQFilters)->byMime("image/*", negate: true)),
            default => throw new \RuntimeException("Not implemented"),
        };
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
     * @param \Pike\Db\FluentDb $db
     */
    public function uploadFile(Request $req,
                               Response $res,
                               Uploader $uploader,
                               UploadsRepository $uploadsRepo,
                               FluentDb $db): void {
        if (!isset($req->files->localFile["error"]) ||
            $req->files->localFile["error"] !== UPLOAD_ERR_OK) {
            throw new PikeException("Expected UPLOAD_ERR_OK (0), but got " .
                isset($req->files->localFile["error"])
                    ? $req->files->localFile["error"]
                    : "<unknown-error>",
                PikeException::FAILED_FS_OP
            );
        } elseif (($errors = self::validateUploadInput($req->body))) {
            $res->status(400)->json($errors);
            return;
        }
        $patched = self::enumerateFileNameIdDuplicate($req->body->targetFileName, $db);
        $fileNameFinal = $patched ?? $req->body->targetFileName;
        // @allow \Pike\PikeException
        if (($file = $uploader->upload(
            file: $req->files->localFile,
            toDir: SIVUJETTI_INDEX_PATH . "public/uploads",
            targetFileName: $fileNameFinal,
            allowedMimes: self::getAllowedMimesFor($req->myData->user->role)
        ))) {
            $file->friendlyName = $req->body->friendlyName;
            $file->createdAt = time();
            $file->updatedAt = $file->createdAt;
        }
        // @allow \Pike\PikeException
        $insertId = $uploadsRepo->insert($file);
        //
        $res->json(["file" => $insertId !== "" ? $file : null]);
    }
    /**
     * Returns "$input-1" or "$input-($max+1)" if there was already a file named
     * $input in the database. Otherwise returns null.
     *
     * @param string $input
     * @param \Pike\Db\FluentDb $db
     * @return string|null
     */
    private static function enumerateFileNameIdDuplicate(string $input, FluentDb $db): ?string {
        $pcs = explode(".", $input);
        $ext = array_pop($pcs);
        $noExt = implode(".", $pcs);

        $names = array_column($db->select("\${p}files")
            ->fields(["fileName"])
            ->where("fileName = ? OR fileName like ?", [$input, "{$noExt}%.{$ext}"])
            ->fetchAll(), "fileName");

        $hadExact = in_array($input, $names, true);
        // Case 1: had no duplicate, no need to patch
        if (!$hadExact) return null;

        // Had duplicate, add "-1" or "-{inc + 1}"
        $max = 1;
        $enumerated = "{$noExt}-{$max}.{$ext}";
        while (in_array($enumerated, $names, true)) {
            $enumerated = "{$noExt}-" . (++$max) . ".{$ext}";
        }
        return $enumerated;
    }
    /**
     * @param object $input
     * @return string[] Error messages or []
     */
    private static function validateUploadInput(object $input): array {
        return Validation::makeObjectValidator()
            ->rule("targetFileName", "type", "string")
            ->rule("targetFileName", "maxLength", 255)
            ->rule("targetFileName", "regexp", "/^[a-z0-9_-]+\.[a-z0-9_.-]+$/")
            ->rule("friendlyName", "type", "string")
            ->rule("friendlyName", "maxLength", 255)
            ->validate($input);
    }
    /**
     * @param int $userRole
     * @return string[]
     */
    private static function getAllowedMimesFor(int $userRole): array {
        $exts = ["jpg","jpeg","png","gif","pdf","doc","ppt","odt","pptx","docx","pps","ppsx","xls","xlsx","key","webp","asc","ogv","mp4","m4v","mov","wmv","avi","mpg","3gp","3g2"];
        if ($userRole < ACL::ROLE_EDITOR)
            $exts = [...$exts, "ttf","eot","otf","woff","woff2"];
        return MimeValidator::extsToMimes($exts);
    }
}
