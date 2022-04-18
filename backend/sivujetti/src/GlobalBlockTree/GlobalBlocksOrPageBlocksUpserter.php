<?php declare(strict_types=1);

namespace Sivujetti\GlobalBlockTree;

use Pike\Db\FluentDb;
use Pike\{ObjectValidator, Request, Validation};
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\Theme\ThemeCssFileUpdaterWriter;

/**
 * Shared funtionality for PUT /api/global-block-trees/:globalBlockTreeId/block-styles
 * and PUT /api/pages/:pageType/:pageId/block-styles.
 */
final class GlobalBlocksOrPageBlocksUpserter {
    /**
     * @param object $input
     * @return string[] Error messages or []
     */
    public static function validateInput(object $input): array {
        [$compiled, $error] = self::compileStyles($input);
        if ($error)
            return [$error];
        $PUSH_ID_LENGTH = 20;
        return self::addStylesValidationRules(Validation::makeObjectValidator(), "styles.*.styles")
            ->rule("styles.*.blockId", "minLength", $PUSH_ID_LENGTH)
            ->validate((object) ["styles" => $compiled]);
    }
    /**
     * @param \Pike\Request $req
     * @param \Pike\Db\FluentDb $db
     * @param string $tableName
     * @param \Sivujetti\Theme\ThemeCssFileUpdaterWriter $cssGen
     * @param ?\Sivujetti\PageType\Entities\PageType $pageType = null
     * @return array{0: int|string|null, 1: string|null, 2: bool|null} [$insertIdOrNumAffectedRows, $error, $stylesExistedAlreadyInDb]
     */
    public static function upsertStyles(Request $req,
                                        FluentDb $db,
                                        string $tableName,
                                        ThemeCssFileUpdaterWriter $cssGen,
                                        ?PageType $pageType = null): array {
        $isGlobalTreeBlock = $tableName === "globalBlocksStyles";
        return $db->getDb()->runInTransaction(function () use ($db, $req, $pageType, $isGlobalTreeBlock, $cssGen) {
            $themeId = $req->params->themeId;
            [$t, $whereQ, $whereVals] = $isGlobalTreeBlock
                ? [
                    "\${p}globalBlocksStyles",
                    "themeId = ? AND globalBlockTreeId = ?",
                    [$themeId, $req->params->globalBlockTreeId],
                ]
                : [
                    "\${p}pageBlocksStyles",
                    "themeId = ? AND pageId=? AND pageTypeName=?",
                    [$themeId, $req->params->pageId, $pageType->name],
                ];

            // 1. Select current styles
            $current = $db->select("\${p}themes t", "stdClass")
                ->fields(["t.name AS themeName", "t.generatedBlockTypeBaseCss",
                          "t.generatedBlockCss", "bs.styles AS stylesJson"])
                ->leftJoin("mutateThis AS bs ON (1=1)")
                ->mutateQWith(function ($q) use ($t, $whereQ) {
                    $join = "(SELECT styles FROM {$t} WHERE {$whereQ})";
                    return str_replace("mutateThis AS", "{$join}", $q);
                })
                ->where("t.id = ?", [...$whereVals, $whereVals[0]])
                ->fetch();
            $hadStylesBefore = !!$current->stylesJson;

            // 2. Upsert
            $asCleanJson = self::createStyles($req->body->styles);
            $result = ($hadStylesBefore
                ? $db->update($t)
                    ->values((object) ["styles" => $asCleanJson])
                    ->where($whereQ, $whereVals)
                : $db->insert($t)
                    ->values((object) array_merge([
                        "styles" => $asCleanJson,
                        "themeId" => $themeId,
                    ], $isGlobalTreeBlock ? [
                        "globalBlockTreeId" => $whereVals[1],
                    ] : [
                        "pageId" => $whereVals[1],
                        "pageTypeName" => $whereVals[2],
                    ]))
            )->execute();
            if ($hadStylesBefore && $result !== 1)
                return [$result, "Expected \$numAffectedRows of update {$t} to equal 1 but got {$result}", null];
            elseif (!$hadStylesBefore && !$result)
                return [$result, "Expected \$lastInsertId not to equal \"\"", null];

            // 3. Update "{$themeName}-generated.css"
            $cssGen->overwriteBlockStylesToDisk(
                $req->body->styles,
                (object) ["generatedBlockTypeBaseCss" => $current->generatedBlockTypeBaseCss,
                          "generatedBlockCss" => $current->generatedBlockCss],
                $current->themeName);

            //
            return [$result, null, $hadStylesBefore];
        });
    }
    /**
     * @param \Pike\ObjectValidator $validator
     * @param string $propPath = "styles"
     * @return \Pike\ObjectValidator
     */
    public static function addStylesValidationRules(ObjectValidator $validator,
                                                    string $propPath = "styles"): ObjectValidator {
        return $validator
            ->rule($propPath, "type", "string")
            ->rule($propPath, "maxLength", 512000);
    }
    /**
     * @param object $input
     * @return array{0: string|null, 1: string|null}
     */
    public static function compileStyle(object $input): array {
        $uncompiled = $input->styles ?? null;
        if (!is_string($uncompiled))
            return [null, "Expected \$input->styles to be a string"];
        return $uncompiled
            ? [str_replace("[[scope]]", "[data-foo]", $uncompiled), null]
            : ["", null];
    }
    /**
     * @param object[] $input $req->body->styles
     * @return string Clean json
     */
    private static function createStyles(array $input): string {
        return json_encode(array_map(fn(object $inputStyle) => (object) [
            "blockId" => $inputStyle->blockId,
            "styles" => $inputStyle->styles,
        ], $input), JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
    }
    /**
     * input = {styles: [{blockId: "1", styles: "[[scope]] > .bar { color: red; }", junk: "foo"}]}
     * output = {styles: [{blockId: "1", styles: ".foo > .bar { color: red; }"}]}
     *
     * @param object $input $req->body
     * @return array{0: array<int, object>|null, 1: string|null}
     */
    private static function compileStyles(object $input): array {
        $ar = $input->styles ?? null;
        if (!is_array($ar))
            return [null, "Expected \$input->styles to be an array"];
        $comp = [];
        foreach ($ar as $i => $style) {
            if (!is_object($style))
                return [null, "Expected \$input->styles[{$i}] to be an object"];
            [$compiled, $err] = self::compileStyle($style);
            if ($err)
                return [null, str_replace("->styles", "->styles[{$i}]->styles", $err)];
            $comp[] = (object) [
                "blockId" => $style->blockId ?? null,
                "styles" => $compiled
            ];
        }
        return [$comp, null];
    }
}
