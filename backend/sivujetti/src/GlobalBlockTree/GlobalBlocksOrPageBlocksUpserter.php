<?php declare(strict_types=1);

namespace Sivujetti\GlobalBlockTree;

use Pike\Db\FluentDb;
use Pike\{ObjectValidator, Request, Validation};
use Sabberworm\CSS\Parser as CssParser;
use Sivujetti\PageType\Entities\PageType;

/**
 * Shared funtionality for PUT /api/global-block-trees/:globalBlockTreeId/block-styles
 * and PUT /api/pages/:pageType/:pageId/block-styles.
 */
abstract class GlobalBlocksOrPageBlocksUpserter {
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
     * @param ?\Sivujetti\PageType\Entities\PageType $pageType = null
     * @return array{0: int|string, 1: bool} [$insertIdOrNumAffectedRows, $stylesExistedAlreadyInDb]
     */
    public static function upsertStyles(Request $req,
                                        FluentDb $db,
                                        string $tableName,
                                        ?PageType $pageType = null): array {
        [$selectQ, $where] = $tableName === "globalBlocksStyles"
            ? [
                $db->select("\${p}globalBlocksStyles")->fields(["globalBlockTreeId"]),
                ["globalBlockTreeId = ?", [$req->params->globalBlockTreeId]],
            ]
            : [
                $db->select("\${p}pageBlocksStyles")->fields(["pageId"]),
                ["pageId=? AND pageTypeName=?", [$req->params->pageId, $pageType->name]],
            ];
        //
        $doesExist = !!$selectQ
            ->where(...$where)
            ->fetch();
        //
        $asCleanJson = self::createStyles($req->body->styles);
        $result = ($doesExist
            ? $db->update($tableName)
                ->values((object) ["styles" => $asCleanJson])
                ->where(...$where)
            : $db->insert($tableName)
                ->values((object) array_merge([
                    "styles" => $asCleanJson,
                ], $tableName === "globalBlocksStyles" ? [
                    "globalBlockTreeId" => $where[1][0],
                ] : [
                    "pageId" => $where[1][0],
                    "pageTypeName" => $where[1][1],
                ]))
        )->execute();
        //
        return [$result, $doesExist];
    }
    /**
     * @param \Pike\ObjectValidator $validator
     * @param string $propPath = "styles"
     * @return \Pike\ObjectValidator
     */
    public static function addStylesValidationRules(ObjectValidator $validator,
                                                    string $propPath = "styles"): ObjectValidator {
        if (!$validator->hasRuleImpl("validCss"))
            $validator->addRuleImpl("validCss", function ($value) {
                if (!is_string($value))
                    return false;
                if (!strlen($value))
                    return true;
                $parser = new CssParser($value);
                $cssDocument = $parser->parse();
                return count($cssDocument->getAllDeclarationBlocks()) > 0;
            }, "%s is not valid CSS");
        return $validator
            ->rule($propPath, "type", "string")
            ->rule($propPath, "maxLength", 512000)
            ->rule($propPath, "validCss");
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
            ? ["[data-foo]" . str_replace("[[scope]]", "[data-foo]", $uncompiled), null]
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
