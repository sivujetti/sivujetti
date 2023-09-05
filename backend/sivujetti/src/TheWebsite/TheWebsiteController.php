<?php declare(strict_types=1);

namespace Sivujetti\TheWebsite;

use Pike\{Request, Response, Validation};
use Pike\Db\FluentDb;
use Pike\Interfaces\FileSystemInterface;
use Sivujetti\{JsonUtils, ValidationUtils};

final class TheWebsiteController {
    private const T = "\${p}theWebsite";
    /**
     * PUT /api/the-website/basic-info: Overwrites website's basic info to the
     * database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb $db
     */
    public function saveBasicInfo(Request $req,
                                  Response $res,
                                  FluentDb $db): void {
        if (($errors = $this->validateSaveBasicInfoInput($req->body))) {
            $res->status(400)->json($errors);
            return;
        }
        //
        $db->update(self::T)
            ->values((object) [
                "name" => $req->body->name,
                "lang" => $req->body->lang,
                "country" => $req->body->country,
                "description" => $req->body->description,
                "hideFromSearchEngines" => $req->body->hideFromSearchEngines,
            ])
            ->where("1=1")
            ->execute();
        //
        $res->json(["ok" => "ok"]);
    }
    /**
     * POST /api/the-website/export: exports local database (excluding plugins)
     * to a single json file SIVUJETTI_BACKEND_PATH . "exported.json".
     *
     * @param \Pike\Response $res
     * @param \Sivujetti\TheWebsite\Exporter $exporter
     * @param \Pike\Interfaces\FileSystemInterface $fs
     */
    public function export(Response $res, Exporter $exporter, FileSystemInterface $fs): void {
        $rows = $exporter->export(); // @allow \Pike\PikeException
        $fs->write(SIVUJETTI_BACKEND_PATH . "exported.json", JsonUtils::stringify($rows));
        $res->json(["ok" => "ok"]);
    }
    /**
     * @param object $input
     * @return string[] Error messages or []
     */
    private function validateSaveBasicInfoInput(object $input): array {
        return Validation::makeObjectValidator()
            ->rule("name", "minLength", 1)
            ->rule("name", "maxLength", ValidationUtils::INDEX_STR_MAX_LENGTH)
            ->rule("lang", "type", "string")
            ->rule("lang", "regexp", "/^[a-z]{2}$/") // see backend/installer/schema.mysql.php
            ->rule("country", "type", "string")
            ->rule("country", "regexp", "/^[A-Z]{2}$/")
            ->rule("description", "maxLength", ValidationUtils::HARD_SHORT_TEXT_MAX_LEN)
            ->rule("hideFromSearchEngines", "type", "bool")
            ->validate($input);
    }
}
