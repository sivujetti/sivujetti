<?php declare(strict_types=1);

namespace Sivujetti\Theme\Entities;

use Pike\Db\NoDupeRowMapper;
use Sivujetti\JsonUtils;

/**
 * @psalm-type StyleUnitMeta = object{id: string, scssTmpl: string, generatedCss: string, suggestedFor: array<string>, vars: array}
 * @psalm-type StyleUnitVarValues = object{id: string, styleUnitMetaId: string, values: array<object{varName: string, value: string}>, generatedCss: string, defaultFor?: string}
*/
final class Theme extends \stdClass {
    /** @var string */
    public string $id;
    /** @var string */
    public string $name;
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
    /** @psalm-var array<StyleUnitMeta> */
    public array $styleUnitMetas;
    /** @psalm-var array<StyleUnitVarValues> */
    public array $styleUnitVarValues;
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
        $out->globalStyles = [];
        $out->styles = [];
        $out->styleUnitMetas = [];
        $out->styleUnitVarValues = [];
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
            $this->styleUnitMetas = [
                (object) [
                    "id" => "j-sm-1",
                    "title" => "Common",
                    "scssTmpl" => "padding: var(--padding) var(--padding) var(--padding) var(--padding);",
                    "generatedCss" => ".j-sm-1 { padding: var(--padding) var(--padding) var(--padding) var(--padding); }",
                    "suggestedFor" => ["all"],
                    "vars" => [
                        (object) ["varName" => "padding", "type" => "length", "args" => [],
                                    "label" => "Padding", "defaultValue" => null]
                    ]
                ],
                (object) [
                    "id" => "j-sm-2",
                    "title" => "Buttons",
                    "scssTmpl" => "background: var(--backgroundNormal); color: var(--text); border-radius: var(--radius); &:hover { background: var(--backgroundHover); }",
                    "generatedCss" => ".j-sm-2 { background: var(--backgroundNormal); color: var(--text); border-radius: var(--radius); } .j-sm-2:hover { background: var(--backgroundHover); }",
                    "suggestedFor" => ["Button"],
                    "vars" => [
                        (object) ["varName" => "backgroundNormal", "type" => "color", "args" => [], "label" => "Background normal",
                                    "defaultValue" => (object) ["data" => "#01e717eff", "type" => "hexa"]],
                        (object) ["varName" => "backgroundHover", "type" => "color", "args" => [], "label" => "Background hover",
                                    "defaultValue" => (object) ["data" => "#22808eff", "type" => "hexa"]],
                        (object) ["varName" => "text", "type" => "color", "args" => [], "label" => "Text",
                                    "defaultValue" => (object) ["data" => "#ffffffff", "type" => "hexa"]],
                        (object) ["varName" => "radius", "type" => "length", "args" => [], "label" => "Radius",
                                    "defaultValue" => (object) ["num" => 20, "unit" => "px"]],
                    ]
                ],
                (object) [
                    "id" => "j-sm-5",
                    "title" => "Menus",
                    "scssTmpl" => implode("\n", [
                        "ul { list-style-type: var(--listStyleType); display: flex; gap: var(--gap); flex-wrap: wrap; li { flex: 0 0 var(--itemsWidth); } }",
                    ]),
                    "generatedCss" => implode(" ", [
                        ".j-sm-5 ul { list-style-type: var(--listStyleType); display: flex; gap: var(--gap); flex-wrap: wrap; }",
                        ".j-sm-5 ul li { flex: 0 0 var(--itemsWidth); }",
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
                    "id" => "j-sm-4",
                    "title" => "Columns",
                    "scssTmpl" => implode("\n", [
                    ]),
                    "generatedCss" => implode(" ", [
                    ]),
                    "suggestedFor" => ["Columns"],
                    "vars" => [
                        (object) ["varName" => "gap", "type" => "length", "args" => [], "label" => "Gap",
                                    "defaultValue" => null],
                    ]
                ],
                (object) [
                    "id" => "j-sm-3",
                    "title" => "Sections",
                    "scssTmpl" => implode("\n", [
                        "position: relative;",
                        "&:before { content: \"\"; background-color: var(--cover); height: 100%; width: 100%; position: absolute; left: 0; top: 0; }",
                        "> div { margin: var(--margin); max-width: var(--maxWidth); }",
                        "> * { position: relative; }",
                    ]),
                    "generatedCss" => implode(" ", [
                        ".j-sm-3 { position: relative; }",
                        ".j-sm-3:before { content: \"\"; background-color: var(--cover); height: 100%; width: 100%; position: absolute; left: 0; top: 0; }",
                        ".j-sm-3 > div { margin: var(--margin); max-width: var(--maxWidth); }",
                        ".j-sm-3 > * { position: relative; }"
                    ]),
                    "suggestedFor" => ["Section"],
                    "vars" => [
                        (object) ["varName" => "margin", "type" => "option", "args" => ["0 auto", "initial"], "label" => "Margin",
                                    "defaultValue" => "initial"],
                        (object) ["varName" => "maxWidth", "type" => "length", "args" => [], "label" => "Max width",
                                    "defaultValue" => null],
                        (object) ["varName" => "cover", "type" => "color", "args" => [], "label" => "Cover",
                                    "defaultValue" => null],
                    ]
                ],
            ];
            $this->styleUnitVarValues = JsonUtils::parse($row->styleUnitVarValsJson);
        }
        unset($this->themeStylesOrderJson);
        unset($this->styleUnitVarValsJson);
        $this->__stash = [];
    }
}
