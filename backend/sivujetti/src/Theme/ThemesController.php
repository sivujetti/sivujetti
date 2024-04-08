<?php declare(strict_types=1);

namespace Sivujetti\Theme;

use Pike\Db\{FluentDb, FluentDb2, NoDupeRowMapper};
use Pike\{FileSystem, PikeException, Request, Response, Validation};
use Sivujetti\BlockType\Entities\{BlockTypes};
use Sivujetti\{JsonUtils, ValidationUtils};
use Sivujetti\Block\BlockTree;
use Sivujetti\Theme\Entities\Style;

/**
 * @psalm-import-type ThemeStyleUnit from \Sivujetti\Theme\Entities\Style
 */
final class ThemesController {
    public const MEDIA_SCOPES = ["all", "960", "840", "600", "480"];
    /**
     * GET /api/themes/:themeId/styles: Lists $req->params->themeId theme's styles.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb $db
     */
    public function getStyles(Request $req, Response $res, FluentDb $db): void {
        if (!defined("USE_NEW_RENDER_FEAT")) {
        $obj = $db->select("\${p}`themes` t", "stdClass")
            ->fields([
                "t.`id` as `themeId`",
                "t.`globalStyles` AS `globalStyles`",
                "ts.`units` AS `themeStylesUnitsJson`",
                "ts.`blockTypeName` AS `themeStylesBlockTypeName`",
            ])
            ->leftJoin("`\${p}themeStyles` ts ON (ts.`themeId` = t.`id`)")
            ->mapWith(new class("themeId") extends NoDupeRowMapper {
                public function doMapRow(object $row, int $i, array $allRows): object {
                    $row->globalStyles = JsonUtils::parse($row->globalStyles);
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
        } else {
        throw new \RuntimeException("todo");
        }
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
        $errors1 = $this->doUpsertStyles($req, $db, $blockTypes, $fs);
        //
        $errors = $errors1 ? $errors1 : (
            property_exists($req->body, "connectedUnits") && is_string($req->body->connectedUnitsBlockTypeName ?? null)
                ? $this->doUpsertStyles($req, $db, $blockTypes, $fs, $req->body->connectedUnitsBlockTypeName)
                : []
        );
        if ($errors) {
            $res->status(400)->json($errors);
            return;
        }
        //
        $res->json(["ok" => "ok"]);
    }
    /**
     * PUT /api/themes/[i:themeId]/styles/all: ...
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb $db
     * @param \Pike\Db\FluentDb2 $db2
     * @param \Pike\FileSystem $fs
     */
    public function upsertStyleChunksAll(Request $req,
                                         Response $res,
                                         FluentDb $db,
                                         FluentDb2 $db2,
                                         FileSystem $fs): void {
        $errors = Validation::makeObjectValidator()
            ->rule("styleChunks", "type", "array")
            ->rule("styleChunks.*.scope.block?", "in", ["single-block", "block-type"])
            ->rule("styleChunks.*.scope.media", "in", self::MEDIA_SCOPES)
            ->rule("styleChunks.*.scope.layer", "in", ["user-styles", "dev-styles", "todo"])
            ->rule("styleChunks.*.scss", "type", "string")
            ->rule("cachedCompiledScreenSizesCss", "minLength", count(self::MEDIA_SCOPES), "array")
            ->rule("cachedCompiledScreenSizesCss.*", "type", "string")
            ->rule("cachedCompiledScreenSizesCss.*", "maxLength", 1024000)
            ->validate($req->body);
        if ($errors) {
            $res->status(400)->json($errors);
            return;
        }

        $whereArgs = ["`id` = ?", [$req->params->themeId]];
        if (!defined("USE_NEW_FLUENT_DB")) {
        $current = $db->select("\${p}themes", "stdClass")
            ->fields(["name", "cachedCompiledScreenSizesCssLengths"])
            ->where(...$whereArgs)
            ->fetch();
        if (!$current)
            throw new PikeException("Theme `{$req->params->themeId}` doesn't exist", PikeException::BAD_INPUT);
        $lengths = $current->cachedCompiledScreenSizesCssLengths;
        $current->cachedScreenSizesCssLengths = array_map(fn($s) => (int)$s, explode(",", $lengths));
        unset($current->cachedCompiledScreenSizesCssLengths);
        } else {
        $current = $db2->select("\${p}themes", "stdClass")
            ->fields(["name", "cachedCompiledScreenSizesCssLengths"])
            ->where(...$whereArgs)
            ->fetch(fn(string $name, string $lengths) => (object) [
                "name" => $name,
                "cachedScreenSizesCssLengths" => array_map(fn($s) => (int)$s, explode(",", $lengths)),
            ]);
        if (!$current)
            throw new PikeException("Theme `{$req->params->themeId}` doesn't exist", PikeException::BAD_INPUT);
        }

        $compiledScreenSizes = $req->body->cachedCompiledScreenSizesCss;
        $compiledScreenSizeLengths = array_map(fn($s) => strlen($s), $compiledScreenSizes);
        $db->update("\${p}themes")
            ->values((object) [
                "styleChunkBundlesAll" => JsonUtils::stringify([
                    "styleChunks" => array_map(fn($b) => (object) [
                        "scss" => $b->scss,
                        "scope" => (object) [
                            "block" => $b->scope->block,
                            "media" => $b->scope->media,
                            "layer" => $b->scope->layer,
                        ]
                    ], $req->body->styleChunks),
                    "cachedCompiledScreenSizesCss" => $compiledScreenSizes,
                ]),
                "cachedCompiledScreenSizesCssLengths" => implode(",", $compiledScreenSizeLengths),
            ])
            ->where(...$whereArgs)
            ->execute();

        $at = !defined("I_LIKE_TES") ? gmdate("D, M d Y H:i:s e") : self::tesDate();
        for ($i = 0; $i < count(self::MEDIA_SCOPES); ++$i) {
            $userAndBaseAndDevStyles = $compiledScreenSizes[$i]; // all layers
            $mediaScopeId = self::MEDIA_SCOPES[$i];
            if (self::mediaScopeCssHasChanged($i, $compiledScreenSizeLengths, $current->cachedScreenSizesCssLengths))
                $fs->write(SIVUJETTI_INDEX_PATH . "public/{$current->name}-generated-sizes-{$mediaScopeId}.css", (
                    "@charset \"utf-8\";\n" .
                    "\n/* Generated by Sivujetti at {$at} */\n" .
                    "\n/* ==== Generated styles start ==== */\n" .
                    $userAndBaseAndDevStyles .
                    "\n/* ==== Generated styles end ==== */\n"
                ));
        }

        $res->json(["ok" => "ok"]);
    }
    /**
     * @param int $i
     * @param int[] $newCompiledScreenSizeLengths
     * @param int[] $curCompiledScreenSizeLengths
     * @return bool
     */
    private static function mediaScopeCssHasChanged(int $i,
                                                    array $newCompiledScreenSizeLengths,
                                                    array $curCcompiledScreenSizeLengths): bool {
        $newLength = $newCompiledScreenSizeLengths[$i] ?? -1;
        $curLength = $curCcompiledScreenSizeLengths[$i] ?? -1;
        return $newLength !== $curLength; // Todo check that $previoslyStoredHash !== hash(new)
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
     * @param string $key = "units"
     * @return string[] Error messages or []
     */
    private function validateUpsertScopedStyleInput(object $input, string $key = "units"): array {
        $key = $key === "units" ? $key : "connectedUnits";
        return Validation::makeObjectValidator()
            ->rule($key, "type", "array")
            ->rule("{$key}.*.id", "maxLength", ValidationUtils::HARD_SHORT_TEXT_MAX_LEN)
            ->rule("{$key}.*.title", "maxLength", ValidationUtils::HARD_SHORT_TEXT_MAX_LEN)
            ->rule("{$key}.*.scss", "type", "string")
            ->rule("{$key}.*.generatedCss", "type", "string")
            ->rule("{$key}.*.optimizedScss?", "type", "string")
            ->rule("{$key}.*.optimizedGeneratedCss?", "type", "string")
            ->rule("{$key}.*.origin", "type", "string")
            ->rule("{$key}.*.specifier", "type", "string")
            ->rule("{$key}.*.isDerivable", "type", "bool")
            ->rule("{$key}.*.derivedFrom?", "type", "string")
            ->validate($input);
    }
    /**
     * @param \Pike\Request $req
     * @param \Pike\Db\FluentDb $db
     * @param \Sivujetti\BlockType\Entities\BlockTypes $blockTypes
     * @param \Pike\FileSystem $fs
     * @param ?string $unitsOnlyBlockTypeName = null
     * @return string[] Error messages or []
     */
    private function doUpsertStyles(Request $req,
                                    FluentDb $db,
                                    BlockTypes $blockTypes,
                                    FileSystem $fs,
                                    ?string $unitsOnlyBlockTypeName = null): array {
        $blockTypeName = $unitsOnlyBlockTypeName ?? $req->params->blockTypeName;
        $isNormalUpsert = $unitsOnlyBlockTypeName === null;
        $bodyKey = $isNormalUpsert ? "units" : "connectedUnits";
        if ($blockTypeName !== "_body_" &&
            !property_exists($blockTypes, $blockTypeName))
            throw new PikeException("Unknown block type `{$blockTypeName}`.",
                                    PikeException::BAD_INPUT);
        if (($errors = $this->validateUpsertScopedStyleInput($req->body, $bodyKey)))
            return $errors;
        //
        $db->getDb()->runInTransaction(function () use ($blockTypeName, $bodyKey, $isNormalUpsert, $req, $db, $fs) {
            $w = ["themeId=? AND blockTypeName=?", [$req->params->themeId, $blockTypeName]];

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

            // 2. Overwrite it's units with $req->body->units|connectedUnits. Note: trust the input
            $db->update("\${p}themeStyles")
                ->values((object) ["units" => BlockTree::toJson(array_map(fn($b) => (object) [
                    "title" => $b->title,
                    "id" => $b->id,
                    "scss" => $b->scss,
                    "generatedCss" => $b->generatedCss,
                    "optimizedScss" => $b->optimizedScss ?? null,
                    "optimizedGeneratedCss" => $b->optimizedGeneratedCss ?? null,
                    "origin" => $b->origin ?? "",
                    "specifier" => $b->specifier ?? "",
                    "isDerivable" => !($b->derivedFrom ?? null) && $b->isDerivable,
                    "derivedFrom" => ($b->derivedFrom ?? null),
                ], $req->body->{$bodyKey}))])
                ->where(...$w)
                ->execute();

            $isRemoteUnitsOnly = !$isNormalUpsert;
            if ($isRemoteUnitsOnly)
                return;

            // 3. Replace or add the updated portion from/to theme.generatedScopedStylesCss
            $generatedCssAll = $current->generatedScopedStylesCss;
            $updatedAll = self::addOrReplaceLines(
                from: $generatedCssAll,
                withLines: self::combineAndWrapCss($req->body->units, $blockTypeName) . "\n",
                startLine: "/* -- .j-{$blockTypeName} classes start -- */\n",
                endLine: "/* -- .j-{$blockTypeName} classes end -- */\n"
            );

            $db->update("\${p}themes")
                ->values((object) ["generatedScopedStylesCss" => $updatedAll,
                                    "stylesLastUpdatedAt" => time()])
                ->where("id=?", [$req->params->themeId])
                ->execute();

            $at = !defined("I_LIKE_TES") ? gmdate("D, M d Y H:i:s e") : self::tesDate();
            // 4. Commit to disk
            $fs->write(SIVUJETTI_INDEX_PATH . "public/{$current->themeName}-generated.css", (
                "@charset \"utf-8\";\n\n".
                "/* Generated by Sivujetti at {$at} */\n\n".
                "/* ==== Scoped styles start ==== */\n" .
                $updatedAll .
                "/* ==== Scoped styles end ==== */\n"
            ));
        });
        return []; // No errors
    }
    /**
     * @psalm-param array<int, ThemeStyleUnit> $units
     * @param string $blockTypeName
     * @return string `@import "foo";<separator>@layer body-units { .j-_body {color:red;} }`
     */
    public static function combineAndWrapCss(array $units, string $blockTypeName): string {
        $noRemote = $blockTypeName !== "_body_" ? array_filter($units, fn($u) => $u->origin !== "_body_") : $units;
        $css = implode("\n", array_map(fn($u) => $u->optimizedGeneratedCss ?? $u->generatedCss, $noRemote));
        $pcs = $blockTypeName !== "_body_" ? [] : explode("/* hoisted decls ends */", $css);
        [$hoisted, $css2] = count($pcs) < 2 ? ["", $css] : ["{$pcs[0]}/* hoisted decls ends */", $pcs[1]];
        $layerName = $blockTypeName !== "_body_" ? "units" : "body-unit";
        return $hoisted . ($css2 ? "@layer {$layerName} { {$css2} }" : "/* - */");
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
    /**
     * @return string "Turdas, 10:56:08 AM, 12th of Morning Star, 2E 23"
     */
    private static function tesDate(): string {
        $tesWeekDays = [
            "Sundas",
            "Morndas",
            "Tirdas",
            "Middas",
            "Turdas",
            "Fredas",
            "Loredas",
        ];

        $tesMonths = [
            "",
            "Morning Star",
            "Sun's Dawn",
            "First Seed",
            "Rain's Hand",
            "Second Seed",
            "Mid Year",
            "Sun's Height",
            "Last Seed",
            "Hearthfire",
            "Frost Fall",
            "Sun's Dusk",
            "Evening Star",
        ];

        $y = date("Y");
        return sprintf("%s, %s of %s, %sE %s",
            $tesWeekDays[(int) date("w")] ?? "?",
            date("g:i:s A, jS"),
            $tesMonths[(int) date("n")] ?? "?",
            $y[0],
            ltrim(substr($y, 1), "0")
        );
    }
}
