<?php declare(strict_types=1);

namespace Sivujetti\Upload;

use Pike\{PikeException, Request, Response, Validation};
use Pike\Db\{FluentDb, FluentDb2};
use Pike\Validation\ObjectValidator;
use Sivujetti\Auth\ACL;
use Sivujetti\Upload\Entities\UploadsEntry;

final class UploadsController {
    private const UPLOADS_DIR_PATH = SIVUJETTI_INDEX_PATH . "public/uploads";
    private const FILES_TABLE_NAME = "\${p}files";
    /**
     * GET /api/uploads/:filters?: Returns a list of files synced to db
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Upload\UploadsRepository $uploadsRepo
     * @param \Pike\Db\FluentDb2 $db2
     */
    public function getUploads(Request $req,
                               Response $res,
                               UploadsRepository $uploadsRepo,
                               FluentDb2 $db2): void {
        if (!defined("USE_NEW_FLUENT_DB")) {
        $files = match (urldecode($req->params->filters)) {
            '{"mime":{"$eq":"image/*"}}' => $uploadsRepo->getMany((new UploadsQFilters)->byMime("image/*")),
            '{"mime":{"$neq":"image/*"}}' => $uploadsRepo->getMany((new UploadsQFilters)->byMime("image/*", negate: true)),
            default => throw new \RuntimeException("Not implemented"),
        };
        } else {
        $files = $db2->select(self::FILES_TABLE_NAME)
            ->where(...(match (urldecode($req->params->filters)) {
                '{"mime":{"$eq":"image/*"}}' => ["`mime` LIKE ?", ["image/%"]],
                '{"mime":{"$neq":"image/*"}}' => ["`mime` NOT LIKE ?", ["image/%"]],
                default => throw new \RuntimeException("Not implemented"),
            }))
            ->orderBy("id DESC")
            ->limit(40)
            ->fetchAll(\PDO::FETCH_CLASS, UploadsEntry::class);
        }
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
     * @param \Pike\Db\FluentDb2 $db2
     */
    public function uploadFile(Request $req,
                               Response $res,
                               Uploader $uploader,
                               UploadsRepository $uploadsRepo,
                               FluentDb $db,
                               FluentDb2 $db2): void {
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
        if (defined("USE_NEW_FLUENT_DB"))
            $db = $db2;
        $maybePatched = self::enumerateFileNameIfDuplicate($req->body->targetFileName, $db);
        $fileNameFinal = $maybePatched ?? $req->body->targetFileName;
        // @allow \Pike\PikeException
        if (($file = $uploader->upload(
            file: $req->files->localFile,
            toDir: self::UPLOADS_DIR_PATH,
            targetFileName: $fileNameFinal,
            allowedMimes: self::getAllowedMimesFor($req->myData->user->role)
        ))) {
            $file->friendlyName = $req->body->friendlyName;
            $file->createdAt = time();
            $file->updatedAt = $file->createdAt;
        }
        if (!defined("USE_NEW_FLUENT_DB")) {
        // @allow \Pike\PikeException
        $insertId = $uploadsRepo->insert($file);
        } else {
        $insertId = $db->insert(self::FILES_TABLE_NAME)
            ->values($file)
            ->execute();
        }
        //
        $res->json(["file" => $insertId !== "" ? $file : null]);
    }
    /**
     * Returns "$input-1" or "$input-($max+1)" if there was already a file named
     * $input in the database. Otherwise returns null.
     *
     * @param string $input
     * @param \Pike\Db\FluentDb|\Pike\Db\FluentDb2 $db
     * @return string|null
     */
    private static function enumerateFileNameIfDuplicate(string $input, FluentDb|FluentDb2 $db): ?string {
        $pcs = explode(".", $input);
        $ext = array_pop($pcs);
        $noExt = implode(".", $pcs);

        $names = array_column($db->select(self::FILES_TABLE_NAME)
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
        return self::makeCommonValidator()
            ->rule("friendlyName", "type", "string")
            ->rule("friendlyName", "maxLength", 255)
            ->validate($input);
    }
    /**
     * @return \Pike\Validation\ObjectValidator
     */
    private static function makeCommonValidator(): ObjectValidator {
        return Validation::makeObjectValidator()
            ->rule("targetFileName", "type", "string")
            ->rule("targetFileName", "maxLength", 255)
            ->rule("targetFileName", "regexp", "/^[a-z0-9_-]+\.[a-z0-9_.-]+$/");
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
