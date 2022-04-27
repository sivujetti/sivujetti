<?php declare(strict_types=1);

namespace Sivujetti\Theme;

use Pike\Db\{FluentDb, NoDupeRowMapper};
use Pike\{PikeException, Request, Response, Validation};
use Sivujetti\BlockType\Entities\BlockTypeStyles;
use Sivujetti\{ValidationUtils};
use Sivujetti\BlockType\Entities\BlockTypes;
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
     * @param \Sivujetti\BlockType\Entities\BlockTypes $blockTypes
     */
    public function upsertBlockTypeStyles(Request $req,
                                          Response $res,
                                          FluentDb $db,
                                          ThemeCssFileUpdaterWriter $cssGen,
                                          BlockTypes $blockTypes): void {
        if (($errors = $this->validateOverwriteBlockTypeStylesInput($req->body))) {
            $res->status(400)->json($errors);
            return;
        }
        if (!property_exists($blockTypes, $req->params->blockTypeName))
            throw new PikeException("Unknown block type `{$req->params->blockTypeName}`.",
                                    PikeException::BAD_INPUT);
        // Force other requests to wait here until this callback has been run
        [$result, $error, $stylesExistedAlready] = $db->getDb()->runInTransaction(function () use ($db, $req, $cssGen) {
            $t = "\${p}themeBlockTypeStyles";
            $themeId = $req->params->themeId;
            [$whereQ, $whereVals] = ["themeId = ? AND blockTypeName = ?", [$themeId, $req->params->blockTypeName]];

            // 1. Select current styles
            $current = $db->select("\${p}themes t", "stdClass")
                ->fields(["t.name AS themeName", "t.generatedBlockTypeBaseCss",
                          "t.generatedBlockCss", "tbts.styles AS stylesJson"])
                ->leftJoin("mutateThis AS tbts ON (1=1)")
                ->mutateQWith(function ($q) use ($t) {
                    $join = "(SELECT styles FROM {$t} WHERE themeId = ? AND blockTypeName = ?)";
                    return str_replace("mutateThis AS", "{$join}", $q);
                })
                ->where("t.id = ?", [...$whereVals, // join
                                     $themeId])     // where
                ->fetch();
            if (!$current)
                return [null, "Theme `{$themeId}` doesn't exist", false];
            $hadStylesBefore = $current->stylesJson !== null;

            // 2. Upsert
            $result = ($hadStylesBefore
                ? $db->update($t)
                    ->values((object) ["styles" => $req->body->styles])
                    ->where($whereQ, $whereVals)
                : $db->insert($t)
                    ->values((object) [
                        "styles" => $req->body->styles,
                        "blockTypeName" => $req->params->blockTypeName,
                        "themeId" => $themeId,
                    ])
            )->execute();
            if ($hadStylesBefore && $result !== 1)
                return [$result, "Expected \$numAffectedRows of update {$t} to equal 1 but got {$result}", null];
            elseif (!$hadStylesBefore && !$result)
                return [$result, "Expected \$lastInsertId not to equal \"\"", null];

            // 3. Update "{$themeName}-generated.css"
            $cssGen->overwriteBlockTypeBaseStylesToDisk(
                $req->params->blockTypeName,
                $req->body->styles,
                (object) ["generatedBlockTypeBaseCss" => $current->generatedBlockTypeBaseCss,
                          "generatedBlockCss" => $current->generatedBlockCss],
                $current->themeName);

            //
            return [$result, null, $hadStylesBefore];
        });
        //
        if ($error)
            throw new PikeException($error, PikeException::ERROR_EXCEPTION);
        if ($stylesExistedAlready)
            $res->status(200)->json(["ok" => "ok"]);
        else
            $res->status(201)->json(["ok" => "ok", "insertId" => $result]);
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
