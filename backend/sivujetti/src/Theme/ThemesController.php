<?php declare(strict_types=1);

namespace Sivujetti\Theme;

use Pike\Db\{FluentDb2};
use Pike\{FileSystem, PikeException, Request, Response, Validation};
use Pike\Auth\Crypto;
use Pike\Validation\ObjectValidator;
use Sivujetti\{JsonUtils, ValidationUtils};

/**
 * @psalm-import-type ThemeStyleUnit from \Sivujetti\Theme\Entities\Style
 * @psalm-import-type StyleChunk from \Sivujetti\Block\Entities\Block
 */
final class ThemesController {
    /**
     * GET /api/themes/:themeId/styles: Lists $req->params->themeId theme's styles.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb2 $db2
     */
    public function getStyles(Request $req, Response $res, FluentDb2 $db2): void {
        throw new \RuntimeException("todo");
    }
    /**
     * PUT /api/themes/:themeId/styles/scope-block-type/:blockTypeName: Overwrites
     * $req->params->blockTypeName's styles of $req->params->themeId theme.
     *
     * @param \Pike\Response $res
     */
    public function upsertBlockTypeScopedStyles(Response $res): void {
        $res->json(["ok" => "ok"]);
    }
    /**
     * PUT /api/themes/[i:themeId]/styles/all: ...
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb2 $db2
     * @param \Pike\FileSystem $fs
     */
    public function upsertStyleChunksAll(Request $req,
                                         Response $res,
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

        $newCompiledCss = $req->body->cachedCompiledCss;
        [
            $newCompiledScreenHashes,
            $newCompiledFilesData,
            $newLastUpdatedAts,
        ] = self::createNewBundle($newCompiledCss, $current);

        [$globalChunks, $pageChunks] = self::splitChunksToStorageGoups($req->body->styleChunks);

        $db2->update("\${p}themes")
            ->values((object) [
                "styleChunkBundlesAll" => JsonUtils::stringify([
                    "styleChunks" => array_map(self::inputToStorableChunk(...), $globalChunks),
                    "cachedCompiledCss" => $newCompiledCss,
                ]),
                "cachedCompiledScreenSizesCssHashes" => implode(",", $newCompiledScreenHashes),
                "stylesLastUpdatedAt" => implode(",", $newLastUpdatedAts),
            ])
            ->where(...$whereArgs)
            ->execute();
        $db2->insert("\${p}pageThemeStyles", orReplace: true)
            ->values((object) [
                "chunks" => JsonUtils::stringify(array_map(self::inputToStorableChunk(...), $pageChunks)),
                "pageId" => $req->body->pageId,
                "pageType" => $req->body->pageType,
                "themeId" => $req->params->themeId,
            ])
            ->execute();

        foreach ($newCompiledFilesData as $itm) {
            if ($itm) $fs->write($itm["filePath"], $itm["contents"]);
        }

        $res->json(["ok" => "ok"]);
    }
    /**
     * PUT /api/themes/:themeId/styles/global: Overwrites $req->params->themeId
     * theme's global styles.
     *
     * @param \Pike\Response $res
     */
    public function updateGlobalStyles(Response $res): void {
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
            ->rule("{$propName}.*.scope.kind", "in", ["single-block", "custom-class", "base-vars", "base-freeform"])
            ->rule("{$propName}.*.scope.page?", "type", "string")
            ->rule("{$propName}.*.scope.page?", "maxLength", 160)
            ->rule("{$propName}.*.scope.layer", "in", ["user-styles", "dev-styles", "base-styles"])
            ->rule("{$propName}.*.data?", "type", "object");
    }
    /**
     * @param string $newCompiledCss
     * @param object $currentTheme
     * @psalm-param object{name: string, cachedScreenSizesCssHashes: string[], stylesLastUpdatedAt: int[]} $currentTheme
     * @return array[]
     * @psalm-return [[string], [array{filePath: string, contents: string}|null], [int]]
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
        $pageIdPair = $input->scope->page ?? null;
        return (object) [
            "scss" => $input->scss,
            "data" => self::createData($input),
            "scope" => (object) [
                "kind" => $input->scope->kind,
                "layer" => $input->scope->layer,
                ...($pageIdPair ? ["page" => $pageIdPair] : []),
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
                    ...(($data->title ?? null) ? ["title" => substr($data->title, 0, ValidationUtils::HARD_SHORT_TEXT_MAX_LEN)] : []),
                    ...(($data->mutationRules ?? null) ? ["mutationRules" => $data->mutationRules] : []),
                ];
        }
        return null;
    }
    /**
     * @param object[] $allChunks
     * @psalm-param StyleChunk[] $allChunks
     * @return array
     * @psalm-return [StyleChunk[], StyleChunk[]]
     */
    private static function splitChunksToStorageGoups(array $allChunks): array {
        $global = [];
        $page = [];
        foreach ($allChunks as $chunk) {
            if (!$chunk->scope->page) $global[] = $chunk;
            else $page[] = $chunk;
        }
        return [$global, $page];
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
