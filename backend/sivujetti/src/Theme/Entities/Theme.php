<?php declare(strict_types=1);

namespace Sivujetti\Theme\Entities;

use Pike\Db\NoDupeRowMapper;
use Sivujetti\JsonUtils;

/**
 * @psalm-type StyleUnitTemplate = object{id: string, todo}
 * @psalm-type StyleUnitInstance = object{id: string, todo}
 * @psalm-type BaseStyleUnit = object{id: string, scssTmpl: string, generatedCss: string, suggestedFor: array<string>, vars: array}
 * @psalm-type VarStyleUnit = object{id: string, baseStyleUnitId: string, values: array<object{varName: string, value: string}>, generatedCss: string, defaultFor?: string}
*/
final class Theme extends \stdClass {
    /** @var string */
    public string $id;
    /** @var string */
    public string $name;
     /** @psalm-var array<StyleUnitTemplate> */
    public array $styleUnitTemplates;
    /** @psalm-var array<StyleUnitInstance> */
    public array $styleUnitInstances;
    /**
     * @deprecated
     * @var object[] [{name: string, friendlyName: string, value: {type: "color", value: string[]}}]
     */
    public array $globalStyles;
    /**
     * @deprecated
     * @var \Sivujetti\Theme\Entities\Style[]
     */
    public array $styles;
    /**
     * @deprecated
     * @psalm-var array<BaseStyleUnit>
     */
    public array $baseStyleUnits;
    /**
     * @deprecated
     * @psalm-var array<VarStyleUnit>
     */
    public array $varStyleUnits;
    /** @var string[] ["_body_", "j-Text" ...] */
    public array $stylesOrder;
    /** @var int Unix timestamp */
    public int $stylesLastUpdatedAt;
    /** @var object[] */
    private array $__stash;
    /**
     * @param object $row
     * @param object[] $rows
     * @return self
     */
    public static function fromParentRs(object $row, array $rows): Theme {
        $out = new self;
        $out->id = strval($row->themeId);
        $out->name = $row->themeName;
        $out->styleUnitTemplates = [];
        $out->styleUnitInstances = [];
        $out->globalStyles = [];
        $out->styles = [];
        $out->baseStyleUnits = [];
        $out->varStyleUnits = [];
        $out->stylesOrder = [];
        $out->stylesLastUpdatedAt = 0;
        $out->__stash = $rows;
        return $out;
    }
    /**
     * @param bool $full
     */
    public function loadStyles(bool $full): void {
        if (!$this->__stash) return;
        $row = $this->__stash[0];
        $this->stylesLastUpdatedAt = (int) $row->themeStylesLastUpdatedAt;
        if ($full) {
            $this->stylesOrder = JsonUtils::parse($row->themeStylesOrderJson);
            //
            $this->styleUnitTemplates = [
                (object) [
                    "id" => "j-Button-base-3",
                    "isFor" => "Button",
                    "title" => "Buttons common",
                    "isCommon" => true,
                    "varMetas" => [
                        (object) ["varName" => "padding", "varType" => "length", "args" => [],
                                    "wrap" => "padding: %s;"],
                        (object) ["varName" => "minWidth", "varType" => "length", "args" => [],
                                    "wrap" => "min-width: %s;"],
                        (object) ["varName" => "minHeight", "varType" => "length", "args" => [],
                                    "wrap" => "min-height: %s;"],
                    ]
                ],
                (object) [
                    "id" => "j-Section-base-1",
                    "isFor" => "Section",
                    "title" => "Sections common",
                    "isCommon" => true,
                    "varMetas" => [
                        (object) ["varName" => "padding", "varType" => "length", "args" => [],
                                    "wrap" => "padding: %s;"],
                        (object) ["varName" => "minWidth", "varType" => "length", "args" => [],
                                    "wrap" => "min-width: %s;"],
                        (object) ["varName" => "minHeight", "varType" => "length", "args" => [],
                                    "wrap" => "min-height: %s;"],
                    ]
                ],
                (object) [
                    "id" => "j-Button-base-2",
                    "isFor" => "Button",
                    "title" => "Buttons common",
                    "isCommon" => true,
                    "varMetas" => [
                        (object) ["varName" => "backgroundNormal", "varType" => "color", "args" => [],
                                    "wrap" => "background: %s;"],
                        (object) ["varName" => "backgroundHover", "varType" => "color", "args" => [],
                                    "wrap" => "&:hover { background: %s; }"],
                        (object) ["varName" => "text", "varType" => "color", "args" => [],
                                    "wrap" => "color: %s;"],
                        (object) ["varName" => "border", "varType" => "color", "args" => [],
                                    "wrap" => "border-color: %s;"],
                        (object) ["varName" => "borderHover", "varType" => "color", "args" => [],
                                    "wrap" => "&:hover { border-color: %s; }"],
                        (object) ["varName" => "radius", "varType" => "length", "args" => [],
                                    "wrap" => "border-radius: %s;"],
                    ],
                ],
            ];
            //
            $this->styleUnitInstances = [
                (object) ["id" => "j-i-Section-1", "describedBy" => "j-Section-base-1",
                            "values" => [(object) ["varName" => "minHeight", "value" => "200px"], (object) ["varName" => "alignItems", "value" => "flex-end"]],
                            "generatedCss" => (
                                ".j-i-Section-1 { min-height: 200px; }" . // Section-base-1
                                ".j-i-Section-1 { position: relative; display: flex; align-items: flex-end; }" . // Section-base-2
                                ".j-i-Section-1 > div { flex: 1 0 0; }"
                            )],
                (object) ["id" => "j-i-Section-2", "describedBy" => "j-Section-base-2", "values" => [(object) ["varName" => "cover", "value" => "salmon"]],
                    "generatedCss" => (
                        ".j-i-Section-2 { position: relative; }" . // Section-base-2
                        ".j-i-Section-2:before { content: \"\"; background-color: salmon; height: 100%; width: 100%; position: absolute; left: 0; top: 0; }" .
                        ".j-i-Section-2 > * { position: relative; }"
                    )],
                (object) ["id" => "j-i-Button-3", "describedBy" => "j-Button-base-3", "values" => [(object) ["varName" => "minWidth", "value" => "100%"]],
                    "generatedCss" => ".j-i-Button-3 { min-width: 100%; }"],
            ];
            //
            $this->baseStyleUnits = [
                (object) [
                    "id" => "j-bu-1",
                    "title" => "Common",
                    "scssTmpl" => "padding: var(--padding) var(--padding) var(--padding) var(--padding);",
                    "generatedCss" => ".j-bu-1 { padding: var(--padding) var(--padding) var(--padding) var(--padding); }",
                    "suggestedFor" => ["all"],
                    "vars" => [
                        (object) ["varName" => "padding", "type" => "length", "args" => [],
                                    "label" => "Padding", "defaultValue" => null]
                    ]
                ],
                (object) [
                    "id" => "j-bu-2",
                    "title" => "Buttons",
                    "scssTmpl" => "background: var(--backgroundNormal); color: var(--text); border-radius: var(--radius); &:hover { background: var(--backgroundHover); }",
                    "generatedCss" => ".j-bu-2 { background: var(--backgroundNormal); color: var(--text); border-radius: var(--radius); } .j-bu-2:hover { background: var(--backgroundHover); }",
                    "suggestedFor" => ["Button"],
                    "vars" => [
                        (object) ["varName" => "backgroundNormal", "type" => "color", "args" => [], "label" => "Background normal",
                                    "defaultValue" => null],
                        (object) ["varName" => "backgroundHover", "type" => "color", "args" => [], "label" => "Background hover",
                                    "defaultValue" => null],
                        (object) ["varName" => "text", "type" => "color", "args" => [], "label" => "Text",
                                    "defaultValue" => null],
                        (object) ["varName" => "radius", "type" => "length", "args" => [], "label" => "Radius",
                                    "defaultValue" => "?px"],
                    ]
                ],
                (object) [
                    "id" => "j-bu-5",
                    "title" => "Menus",
                    "scssTmpl" => implode("\n", [
                        "ul { list-style-type: var(--listStyleType); display: flex; gap: var(--gap); flex-wrap: wrap; li { flex: 0 0 var(--itemsWidth); } }",
                    ]),
                    "generatedCss" => implode(" ", [
                        ".j-bu-5 ul { list-style-type: var(--listStyleType); display: flex; gap: var(--gap); flex-wrap: wrap; }",
                        ".j-bu-5 ul li { flex: 0 0 var(--itemsWidth); }",
                    ]),
                    "suggestedFor" => ["Menu"],
                    "vars" => [
                        (object) ["varName" => "listStyleType", "type" => "option", "args" => ["none", "initial", "circle", "decimal", "disc", "disclosure-closed",
                                    "disclosure-open", "square"], "label" => "List style type",
                                    "defaultValue" => "initial"],
                        (object) ["varName" => "gap", "type" => "length", "args" => [], "label" => "Gap",
                                    "defaultValue" => "0.2rem"],
                        (object) ["varName" => "itemsWidth", "type" => "option", "args" => ["100%", "0%", 1], "label" => "Items width",
                                    "defaultValue" => "100%"],
                    ]
                ],
                (object) [
                    "id" => "j-bu-4",
                    "title" => "Columns",
                    "scssTmpl" => implode("\n", [
                        "align-items: var(--alignItems); gap: var(--gap);"
                    ]),
                    "generatedCss" => implode(" ", [
                        ".j-bu-4 { align-items: var(--alignItems); gap: var(--gap); }"
                    ]),
                    "suggestedFor" => ["Columns"],
                    "vars" => [
                        (object) ["varName" => "alignItems", "type" => "option", "args" => ["normal", "start", "center", "end", "stretch", "baseline",
                                    "first baseline", "last baseline",], "label" => "Align items",
                                    "defaultValue" => "normal"],
                        (object) ["varName" => "gap", "type" => "length", "args" => [], "label" => "Gap",
                                    "defaultValue" => null],
                    ]
                ],
                (object) [
                    "id" => "j-bu-3",
                    "title" => "Sections",
                    "scssTmpl" => implode("\n", [
                        "position: relative; display: flex; align-items: var(--alignItems);",
                        "&:before { content: \"\"; background-color: var(--cover); height: 100%; width: 100%; position: absolute; left: 0; top: 0; }",
                        "> div { margin: var(--margin); max-width: var(--maxWidth); flex: 1 0 0; }",
                        "> * { position: relative; }",
                    ]),
                    "generatedCss" => implode(" ", [
                        ".j-bu-3 { position: relative; display: flex; align-items: var(--alignItems); }",
                        ".j-bu-3:before { content: \"\"; background-color: var(--cover); height: 100%; width: 100%; position: absolute; left: 0; top: 0; }",
                        ".j-bu-3 > div { margin: var(--margin); max-width: var(--maxWidth); flex: 1 0 0; }",
                        ".j-bu-3 > * { position: relative; }"
                    ]),
                    "suggestedFor" => ["Section"],
                    "vars" => [
                        (object) ["varName" => "margin", "type" => "option", "args" => ["0 auto", "initial"], "label" => "Margin",
                                    "defaultValue" => "initial"],
                        // (object) ["varName" => "margin", "type" => "length", "args" => [], "label" => "Margin",
                        //             "defaultValue" => null],
                        (object) ["varName" => "maxWidth", "type" => "length", "args" => [], "label" => "Max width",
                                    "defaultValue" => "?px"],
                        (object) ["varName" => "cover", "type" => "color", "args" => [], "label" => "Cover",
                                    "defaultValue" => null],
                        (object) ["varName" => "alignItems", "type" => "option", "args" => ["flex-star", "center", "flex-end"],
                                    "label" => "Align items", "defaultValue" => "center"],
                    ]
                ],
            ];
            $this->varStyleUnits = JsonUtils::parse($row->varStyleUnitsJson);
            //
            $this->styles = NoDupeRowMapper::collectOnce($this->__stash, fn($row2) =>
                strval($row2->themeId) === $this->id ? Style::fromParentRs($row2) : null
            , "themeStylesBlockTypeName", []);
            $ordinals = array_flip($this->stylesOrder); // ["_body_","j-Text"...] => ["_body_"=>0,"j-Text"=>1...]
            usort($this->styles, fn($a, $b) =>
                ($ordinals[$a->blockTypeName] ?? PHP_INT_MAX) <=> ($ordinals[$b->blockTypeName] ?? PHP_INT_MAX)
            );
            unset($this->themeStylesUnits);
        }
        unset($this->themeStylesOrderJson);
        unset($this->varStyleUnitsJson);
        $this->__stash = [];
    }
}
