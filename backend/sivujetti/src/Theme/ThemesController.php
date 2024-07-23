<?php declare(strict_types=1);

namespace Sivujetti\Theme;

use Pike\Db\{FluentDb, FluentDb2};
use Pike\{FileSystem, PikeException, Request, Response, Validation};
use Pike\Auth\Crypto;
use Pike\Validation\ObjectValidator;
use Sivujetti\BlockType\Entities\{BlockTypes};
use Sivujetti\{JsonUtils, ValidationUtils};
use Sivujetti\Block\BlockTree;

/**
 * @psalm-import-type ThemeStyleUnit from \Sivujetti\Theme\Entities\Style
 */
final class ThemesController {
    /**
     * GET /api/themes/:themeId/styles: Lists $req->params->themeId theme's styles.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb $db
     */
    public function getStyles(Request $req, Response $res, FluentDb $db): void {
        throw new \RuntimeException("todo");
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
        $errors = self::addRulesForStyleChunks(Validation::makeObjectValidator())
            ->rule("cachedCompiledCss", "type", "string")
            ->rule("cachedCompiledCss", "maxLength", 1024000)
            ->validate($req->body);
        if ($errors) {
            $res->status(400)->json($errors);
            return;
        }

        $whereArgs = ["`id` = ?", [$req->params->themeId]];
        if (!defined("USE_NEW_FLUENT_DB")) {
        $current = $db->select("\${p}themes", "stdClass")
            ->fields(["name", "cachedCompiledScreenSizesCssHashes"])
            ->where(...$whereArgs)
            ->fetch();
        if (!$current)
            throw new PikeException("Theme `{$req->params->themeId}` doesn't exist", PikeException::BAD_INPUT);
        $current->cachedScreenSizesCssHashes = explode(",", $current->cachedCompiledScreenSizesCssHashes);
        unset($current->cachedCompiledScreenSizesCssHashes);
        } else {
        $current = $db2->select("\${p}themes")
            ->fields(["name", "cachedCompiledScreenSizesCssHashes", "stylesLastUpdatedAt"])
            ->where(...$whereArgs)
            ->fetch(fn(string $name, string $hashes, string $lastUpdated) => (object) [
                "name" => $name,
                "cachedScreenSizesCssHashes" => explode(",", $hashes),
                "stylesLastUpdatedAt" => array_map(fn($s) => (int)$s, explode(",", $lastUpdated)),
            ]);
        if (!$current)
            throw new PikeException("Theme `{$req->params->themeId}` doesn't exist", PikeException::BAD_INPUT);
        }

        $newCompiledCss = $req->body->cachedCompiledCss;
        [
            $newCompiledScreenHashes,
            $newCompiledFilesData,
            $newLastUpdatedAts,
        ] = self::createNewBundle($newCompiledCss, $current);

        $db3 = !defined("USE_NEW_FLUENT_DB") ? $db : $db2;
        $db3->update("\${p}themes")
            ->values((object) [
                "styleChunkBundlesAll" => JsonUtils::stringify([
                    "styleChunks" => array_map(self::inputToStorableChunk(...), $req->body->styleChunks),
                    "cachedCompiledCss" => $newCompiledCss,
                ]),
                "cachedCompiledScreenSizesCssHashes" => implode(",", $newCompiledScreenHashes),
                "stylesLastUpdatedAt" => implode(",", $newLastUpdatedAts),
            ])
            ->where(...$whereArgs)
            ->execute();

        foreach ($newCompiledFilesData as $itm) {
            if ($itm) $fs->write($itm["filePath"], $itm["contents"]);
        }

        $res->json(["ok" => "ok"]);
    }
    /**
     * @param string $newCompiledCss
     * @param object $currentTheme
     * @psalm-param object{name: string, cachedScreenSizesCssHashes: string[], stylesLastUpdatedAt: int[]} $currentTheme
     * @return array[]
     * @psalm-return [[string, string, string, string, string], [array{filePath: string, contents: string}|null, array{filePath: string, contents: string}|null, array{filePath: string, contents: string}|null, array{filePath: string, contents: string}|null, array{filePath: string, contents: string}|null], [int, int, int, int, int]]
     */
    private static function createNewBundle(string $newCompiledCss,
                                             object $currentTheme): array {
        $crypto = new Crypto;
        $newHashes = [$crypto->hash("sha256", $newCompiledCss)];

        $now = time();
        $at = !defined("I_LIKE_TES") ? gmdate("D, M d Y H:i:s e", $now) : self::tesDate($now);
        $newFilesData = [self::mediaScopeCssHasChanged(0, $newHashes, $currentTheme->cachedScreenSizesCssHashes)
            ? [
                "filePath" => SIVUJETTI_INDEX_PATH . "public/{$currentTheme->name}-generated.css",
                "contents" => (
                    "@charset \"utf-8\";\n" .
                    "\n/* Generated by Sivujetti at {$at} */\n" .
                    "\n/* ==== Generated styles start ==== */\n" .
                    $newCompiledCss .
                    "\n/* ==== Generated styles end ==== */\n"
                )
            ]
            : null
        ];

        $newTimes = [$newFilesData[0] ? $now : $currentTheme->stylesLastUpdatedAt[0]];

        return [
            $newHashes,
            $newFilesData,
            $newTimes,
        ];
    }
    /**
     * @param object $input
     * @return object
     */
    private static function inputToStorableChunk(object $input): object {
        return (object) [
            "scss" => $input->scss,
            "data" => self::createData($input),
            "scope" => (object) [
                "kind" => $input->scope->kind,
                "media" => $input->scope->media,
                "layer" => $input->scope->layer,
                "page" => $input->scope->page,
            ]
        ];
    }
    /**
     * @param object $input
     * @return object|null
     */
    private static function createData(object $input): ?object {
        if (($data = $input->data ?? null)) {
            if ($input->scope->kind === "custom-class")
                return (object) [
                    "title" => substr($data->title, 0, ValidationUtils::HARD_SHORT_TEXT_MAX_LEN),
                    ...(($data->mutationRules ?? null) ? ["mutationRules" => $data->mutationRules] : []),
                ];
        }
        return null;
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
     * @param \Pike\Validation\ObjectValidator $validator
     * @param string $propName = "styleChunks"
     * @return \Pike\Validation\ObjectValidator
     */
    public static function addRulesForStyleChunks(ObjectValidator $validator,
                                                  string $propName = "styleChunks"): ObjectValidator {
        return $validator
            ->rule("{$propName}", "type", "array")
            ->rule("{$propName}.*.scss", "type", "string")
            ->rule("{$propName}.*.data?", "type", "object")
            ->rule("{$propName}.*.scope.kind", "in", ["single-block", "custom-class", "base-vars", "base-freeform"])
            ->rule("{$propName}.*.scope.page?", "type", "string")
            ->rule("{$propName}.*.scope.layer", "in", ["user-styles", "dev-styles", "base-styles"]);
    }
    /**
     * @param int $i
     * @param string[] $newCompiledScreenHashes
     * @param string[] $curCompiledScreenHashes
     * @return bool
     */
    private static function mediaScopeCssHasChanged(int $i,
                                                    array $newCompiledScreenHashes,
                                                    array $curCompiledScreenHashes): bool {
        $newHash = $newCompiledScreenHashes[$i] ?? "-";
        $curHash = $curCompiledScreenHashes[$i] ?? "-";
        return $newHash !== $curHash;
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
     * @param ?int $timestamp = null
     * @return string "Turdas, 10:56:08 AM, 12th of Morning Star, 2E 23"
     */
    private static function tesDate(?int $timestamp = null): string {
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

        $y = date("Y", $timestamp);
        return sprintf("%s, %s of %s, %sE %s",
            $tesWeekDays[(int) date("w")] ?? "?",
            date("g:i:s A, jS"),
            $tesMonths[(int) date("n")] ?? "?",
            $y[0],
            ltrim(substr($y, 1), "0")
        );
    }
}
