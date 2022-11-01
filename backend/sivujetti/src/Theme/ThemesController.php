<?php declare(strict_types=1);

namespace Sivujetti\Theme;

use Pike\Db\{FluentDb, NoDupeRowMapper};
use Pike\{FileSystem, PikeException, Request, Response, Validation};
use Sivujetti\BlockType\Entities\{BlockTypes};
use Sivujetti\{ValidationUtils};
use Sivujetti\Block\BlockTree;
use Sivujetti\Theme\Entities\Style;

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
                "ts.`units` AS `themeStylesUnits`",
                "ts.`blockTypeName` AS `themeStylesBlockTypeName`",
            ])
            ->leftJoin("`\${p}themeStyles` ts ON (ts.`themeId` = t.`id`)")
            ->mapWith(new class("themeId") extends NoDupeRowMapper {
                public function doMapRow(object $row, int $i, array $allRows): object {
                    $row->globalStyles = json_decode($row->globalStyles, flags: JSON_THROW_ON_ERROR);
                    $row->styles = self::collectOnce($allRows, fn($row) =>
                        Style::fromParentRs($row)
                    , "themeStylesBlockTypeName", [], 1);
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
     * PUT /api/themes/:themeId/styles/scope-block-type/:blockTypeName: Overwrites
     * $req->params->blockTypeName's styles of $req->params->themeId theme.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb $db
     * @param \Sivujetti\BlockType\Entities\BlockTypes $blockTypes
     * @param \Pike\FileSystem $fs
     */
    public function upsertBlockTypeScopedStyles(Request $req,
                                                Response $res,
                                                FluentDb $db,
                                                BlockTypes $blockTypes,
                                                FileSystem $fs): void {
        if ($req->params->blockTypeName !== "_body_" &&
            !property_exists($blockTypes, $req->params->blockTypeName))
            throw new PikeException("Unknown block type `{$req->params->blockTypeName}`.",
                                    PikeException::BAD_INPUT);
        if (($errors = $this->validateUpsertScopedStyleInput($req->body))) {
            $res->status(400)->json($errors);
            return;
        }
        //
        $db->getDb()->runInTransaction(function () use ($req, $db, $fs) {
            $w = ["themeId=? AND blockTypeName=?", [$req->params->themeId, $req->params->blockTypeName]];

            // 1. Select current style
            $current = $db->select("\${p}themes t", "stdClass")
                ->fields(["t.name AS themeName", "t.generatedScopedStylesCss", "ts.units AS unitsJson"])
                ->leftJoin("mutateThis AS ts ON (1=1)")
                ->mutateQWith(fn($q) =>
                    str_replace("mutateThis AS", "(SELECT units FROM \${p}themeStyles WHERE {$w[0]})", $q)
                )
                ->where("t.id = ?", [...$w[1],               // join
                                     $req->params->themeId]) // where
                ->fetch();
            if (!$current)
                throw new PikeException("Theme `{$req->params->themeId}` doesn't exist", PikeException::BAD_INPUT);

            // 2. Overwrite it's units with $req->body->units. Note: trust the input
            $db->update("\${p}themeStyles")
                ->values((object) ["units" => BlockTree::toJson(array_map(fn($b) => (object) [
                    "title" => $b->title,
                    "id" => $b->id,
                    "scss" => $b->scss,
                    "generatedCss" => $b->generatedCss,
                ], $req->body->units))])
                ->where(...$w)
                ->execute();

            // 3. Replace or add the updated portion from/to theme.generatedScopedStylesCss
            $generatedCssAll = $current->generatedScopedStylesCss;
            $layerName = $req->params->blockTypeName !== "_body_" ? "units" : "body-unit";
            $joined = $req->body->units ? implode("\n", array_map(fn($b) => $b->generatedCss, $req->body->units)) : "";
            $updatedAll = self::addOrReplaceLines(
                from: $generatedCssAll,
                withLines: ($joined ? "@layer {$layerName} { {$joined} }" : "/* - */") . "\n",
                startLine: "/* -- .j-{$req->params->blockTypeName} classes start -- */\n",
                endLine: "/* -- .j-{$req->params->blockTypeName} classes end -- */\n"
            );
            $db->update("\${p}themes")
                ->values((object) ["generatedScopedStylesCss" => $updatedAll,
                                    "stylesLastUpdatedAt" => time()])
                ->where("id=?", [$req->params->themeId])
                ->execute();

            // 4. Commit to disk
            $fs->write(SIVUJETTI_INDEX_PATH . "public/{$current->themeName}-generated.css", (
                "/* Generated by Sivujetti at " . gmdate("D, M d Y H:i:s e", time()) . " */\n\n".
                "/* ==== Scoped styles start ==== */\n" .
                $updatedAll .
                "/* ==== Scoped styles end ==== */\n"
            ));
        });
        //
        $res->json(["ok" => "ok"]);
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
    private function validateUpsertScopedStyleInput(object $input): array {
        return Validation::makeObjectValidator()
            ->rule("units", "type", "array")
            ->rule("units.*.id", "maxLength", ValidationUtils::HARD_SHORT_TEXT_MAX_LEN)
            ->rule("units.*.title", "maxLength", ValidationUtils::HARD_SHORT_TEXT_MAX_LEN)
            ->rule("units.*.scss", "type", "string")
            ->rule("units.*.generatedCss", "type", "string")
            ->validate($input);
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
    /**
     * @param string $from The haystack
     * @param string $withLines
     * @param string $startLine
     * @param string $endLine
     * @return string
     */
    private static function addOrReplaceLines(string $from,
                                              string $withLines,
                                              string $startLine,
                                              string $endLine): string {
        $startLineStartPos = strpos($from, $startLine);
        if ($startLineStartPos !== false) {
            return self::replaceLinesBetween($from, $withLines, $startLine, $endLine, $startLineStartPos);
        }
        return "{$from}{$startLine}{$withLines}{$endLine}";
    }
    /**
     * Replaces every line between $startLine and $endLine with $startLine + $withLines
     * from $from.
     *
     * @param string $from The haystack
     * @param string $withLines Lines to add after $startLine
     * @param string $startLine Add $withLines after this line or offset
     * @param string $endLine
     * @param ?int $startLineStartPos = null
     * @return string
     * @throws \Pike\PikeException If $from doesn't contain $startLine or $endLine
     */
    public static function replaceLinesBetween(string $from,
                                                string $withLines,
                                                string $startLine,
                                                string $endLine,
                                                ?int $startLineStartPos = null): string {
        if ($startLineStartPos === null && ($startLineStartPos = strpos($from, $startLine)) === false)
            throw new PikeException("\$from doesn't contain line `{$startLine}`",
                                    PikeException::ERROR_EXCEPTION);
        $beginningOfLineAfterStartLinePos = $startLineStartPos + strlen($startLine);
        $endLineStartPos = strpos($from, $endLine, $beginningOfLineAfterStartLinePos);
        if ($endLineStartPos === false)
            throw new PikeException("\$from doesn't contain line `{$endLine}`",
                                    PikeException::ERROR_EXCEPTION);
        return (
            substr($from, 0, $beginningOfLineAfterStartLinePos) .
            $withLines .
            substr($from, $endLineStartPos)
        );
    }
}
