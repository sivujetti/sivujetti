<?php declare(strict_types=1);

namespace Sivujetti\Theme;

use Pike\Db\FluentDb;
use Pike\{Request, Response};

final class ThemesController {
    /**
     * GET /api/themes/:themeId/styles: Lists $req->params->themeId theme's styles,
     * or returns an empty list with 404.
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
}
