<?php declare(strict_types=1);

namespace Sivujetti\Theme;

use Pike\Db\{FluentDb, NoDupeRowMapper};
use Pike\{Request, Response, Validation};
use Sivujetti\BlockType\Entities\BlockTypeStyles;
use Sivujetti\{ValidationUtils};
use Sivujetti\GlobalBlockTree\GlobalBlocksOrPageBlocksUpserter;

final class ThemesController {
    /**
     * GET /api/themes/:themeId/styles: Lists $req->params->themeId theme's styles.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb $db
     */
    public function getStyles(Request $req, Response $res, FluentDb $db): void {
        $obj = $db->select("\${p}`themes` t", "stdClass")
            ->fields([
                "t.`id` as `themeId`",
                "t.`globalStyles` AS `globalStyles`",
                "tbts.`blockTypeName` AS `themeBlockTypeStylesBlockTypeName`",
                "tbts.`styles` AS `themeBlockTypeStylesStyles`"
            ])
            ->leftJoin("`\${p}themeBlockTypeStyles` tbts ON (tbts.`themeId` = t.`id`)")
            ->mapWith(new class("themeId") extends NoDupeRowMapper {
                public function doMapRow(object $row, int $i, array $allRows): object {
                    $row->globalStyles = json_decode($row->globalStyles, flags: JSON_THROW_ON_ERROR);
                    $row->blockTypeStyles = self::collectOnce($allRows, fn($row) =>
                        BlockTypeStyles::fromParentRs($row)
                    , "themeBlockTypeStylesBlockTypeName", []);
                    return $row;
                }
            })
            ->where("t.`id` = ?", [$req->params->themeId])
            ->fetchAll()[0] ?? null;
        if (!$obj) {
            $res->status(404)->json([]);
            return;
        }
        $res->json($obj);
    }
    /**
     * PUT /api/themes/:themeId/styles/block-type/:blockTypeName: Overwrites
     * $req->params->blockTypeName's styles of $req->params->themeId theme.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb $db
     * @param \Sivujetti\Theme\ThemeCssFileUpdaterWriter $cssGen
     */
    public function updateBlockTypeStyles(Request $req,
                                          Response $res,
                                          FluentDb $db,
                                          ThemeCssFileUpdaterWriter $cssGen): void {
        if (($errors = $this->validateOverwriteBlockTypeStylesInput($req->body))) {
            $res->status(400)->json($errors);
            return;
        }
        // Force other requests to wait here until this callback has been run
        $allDone = $db->getDb()->runInTransaction(function () use ($db, $req, $cssGen) {
            $current = $db->select("\${p}themes t", "stdClass")
                ->fields(["t.name AS themeName", "t.generatedBlockTypeBaseCss",
                          "t.generatedBlockCss", "tbts.styles AS stylesJson"])
                ->innerJoin("\${p}themeBlockTypeStyles tbts ON (tbts.themeId = t.id)")
                ->where("t.id = ?", [$req->params->themeId])
                ->fetch();
            if (!$current)
                throw new \RuntimeException("Inserting styles not implemented yet.");
            //
            $numRows = $db->update("\${p}themeBlockTypeStyles")
                ->values((object) ["styles" => $req->body->styles])
                ->where("`blockTypeName` = ? AND `themeId` = ?", [$req->params->blockTypeName, $req->params->themeId])
                ->execute();
            if ($numRows !== 1)
                return false;
            //
            $cssGen->overwriteBlockTypeBaseStylesToDisk(
                $req->params->blockTypeName,
                $req->body->styles,
                (object) ["generatedBlockTypeBaseCss" => $current->generatedBlockTypeBaseCss,
                          "generatedBlockCss" => $current->generatedBlockCss],
                $current->themeName);
            return true;
        });
        //
        if ($allDone) $res->json(["ok" => "ok"]);
        else $res->status(404)->json(["ok" => "err"]);
    }
    /**
     * PUT /api/themes/:themeId/styles/global: Overwrites $req->params->themeId
     * theme's global styles.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb $db
     */
    public function updateGlobalStyles(Request $req, Response $res, FluentDb $db): void {
        if (($errors = $this->validateOverwriteGlobalStylesInput($req->body))) {
            $res->status(400)->json($errors);
            return;
        }
        $numRows = $db->update("\${p}themes")
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
    private function validateOverwriteBlockTypeStylesInput(object $input): array {
        [$compiled, $err] = GlobalBlocksOrPageBlocksUpserter::compileStyle($input);
        return !$err ? GlobalBlocksOrPageBlocksUpserter::addStylesValidationRules(Validation::makeObjectValidator())
            ->validate((object) ["styles" => $compiled]) : [$err];
    }
    /**
     * @param object $input
     * @return string[] Error messages or []
     */
    private function validateOverwriteGlobalStylesInput(object $input): array {
        return Validation::makeObjectValidator()
            ->rule("allStyles", "minLength", 1, "array")
            ->rule("allStyles.*.name", "identifier")
            ->rule("allStyles.*.name", "maxLength", ValidationUtils::HARD_SHORT_TEXT_MAX_LEN)
            ->rule("allStyles.*.friendlyName", "maxLength", ValidationUtils::HARD_SHORT_TEXT_MAX_LEN)
            ->rule("allStyles.*.value.type", "in", ["color"])
            ->rule("allStyles.*.value.value", "minLength", 4, "array")
            ->rule("allStyles.*.value.value.*", "maxLength", 2)
            ->rule("allStyles.*.value.value.*", "stringType", "xdigit")
            ->validate($input);
    }
}
