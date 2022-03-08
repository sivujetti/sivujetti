<?php declare(strict_types=1);

namespace Sivujetti\Theme;

use Pike\Db\FluentDb;
use Pike\{Request, Response, Validation};
use Sivujetti\ValidationUtils;

final class ThemesController {
    /**
     * GET /api/themes/:themeId/styles: Lists $req->params->themeId theme's styles.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb $db
     */
    public function getStyles(Request $req, Response $res, FluentDb $db): void {
        $obj = $db->select("themes", "stdClass")
            ->fields(["`globalStyles` AS `stylesJson`"])
            ->where("`id` = ?", [$req->params->themeId])
            ->fetch();
        if (!$obj) {
            $res->status(404)->json([]);
            return;
        }
        $res->json(json_decode($obj->stylesJson, flags: JSON_THROW_ON_ERROR));
    }
    /**
     * PUT /api/themes/:themeId/styles: Overwrites $req->params->themeId theme's styles.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb $db
     */
    public function updateStyles(Request $req, Response $res, FluentDb $db): void {
        if (($errors = $this->validateOverwriteStylesInput($req->body))) {
            $res->status(400)->json($errors);
            return;
        }
        $numRows = $db->update("themes")
            ->values((object) ["globalStyles" => json_encode($req->body->allStyles, JSON_UNESCAPED_UNICODE)])
            ->where("`id` = ?", [$req->params->themeId])
            ->execute();
        if ($numRows !== 1) {
            $res->status(404)->json(["ok" => "err"]);
            return;
        }
        $res->json(["ok" => "ok"]);
    }
    /**
     * @param object $input
     * @return string[] Error messages or []
     */
    private function validateOverwriteStylesInput(object $input): array {
        return Validation::makeObjectValidator()
            ->rule("allStyles", "minLength", 1, "array")
            ->rule("allStyles.*.name", "identifier")
            ->rule("allStyles.*.name", "maxLength", ValidationUtils::HARD_SHORT_TEXT_MAX_LEN)
            ->rule("allStyles.*.friendlyName", "maxLength", ValidationUtils::HARD_SHORT_TEXT_MAX_LEN)
            ->rule("allStyles.*.value.type", "in", ["color"])
            ->rule("allStyles.*.value.value", "minLength", 4, "array")
            ->rule("allStyles.*.value.value.*", "maxLength", 2)
            ->rule("allStyles.*.value.value.*", "type", "hexDigitString")
            ->validate($input);
    }
}
