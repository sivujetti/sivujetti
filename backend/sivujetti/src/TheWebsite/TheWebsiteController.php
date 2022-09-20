<?php declare(strict_types=1);

namespace Sivujetti\TheWebsite;

use Pike\{Request, Response, Validation};
use Pike\Db\FluentDb;
use Sivujetti\ValidationUtils;

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
            ])
            ->where("1=1")
            ->execute();
        //
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
            ->rule("lang", "minLength", 1)
            ->rule("lang", "maxLength", 6) // see backend/installer/schema.mysql.php
            ->rule("country", "minLength", 1)
            ->rule("country", "maxLength", 12)
            ->rule("description", "maxLength", ValidationUtils::HARD_SHORT_TEXT_MAX_LEN)
            ->validate($input);
    }
}
