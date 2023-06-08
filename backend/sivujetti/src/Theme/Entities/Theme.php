<?php declare(strict_types=1);

namespace Sivujetti\Theme\Entities;

use Pike\Db\NoDupeRowMapper;
use Sivujetti\JsonUtils;

final class Theme extends \stdClass {
    /** @var string */
    public string $id;
    /** @var string */
    public string $name;
    /** @var object[] [{name: string, friendlyName: string, value: {type: "color", value: string[]}}] */
    public array $globalStyles;
    /** @var \Sivujetti\Theme\Entities\Style[] */
    public array $styles;
    /** @var array<object{id: string, scssTmpl: string, generatedCss: string, suggestedFor: array<string>, vars: array}> */
    public array $styleUnitMetas;
    /** @var array<object{id: string, styleUnitMetaId: string, values: array<object{varName: string, value: string}>, generatedCss: string}> */
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
            $this->globalStyles = JsonUtils::parse($row->themeGlobalStylesJson);
            $this->stylesOrder = JsonUtils::parse($row->themeStylesOrderJson);
            //
            $this->styles = NoDupeRowMapper::collectOnce($this->__stash, fn($row2) =>
                strval($row2->themeId) === $this->id ? Style::fromParentRs($row2) : null
            , "themeStylesBlockTypeName", []);
            $ordinals = array_flip($this->stylesOrder); // ["_body_","j-Text"...] => ["_body_"=>0,"j-Text"=>1...]
            usort($this->styles, fn($a, $b) =>
                ($ordinals[$a->blockTypeName] ?? PHP_INT_MAX) <=> ($ordinals[$b->blockTypeName] ?? PHP_INT_MAX)
            );
            //
            $this->styleUnitMetas = [
                (object) [
                    "id" => "j-sm-1",
                    "title" => "Common",
                    "scssTmpl" => "padding: var(--padding) var(--padding) var(--padding) var(--padding);",
                    "generatedCss" => ".j-sm-1 { padding: var(--padding) var(--padding) var(--padding) var(--padding); }",
                    "suggestedFor" => ["all"],
                    "vars" => [
                        (object) ["varName" => "padding", "type" => "length", "label" => "Padding", "defaultValue" => null]
                    ]
                ],
                (object) [
                    "id" => "j-sm-2",
                    "title" => "Buttons",
                    "scssTmpl" => "background: var(--backgroundNormal); color: var(--text); border-radius: var(--radius); &:hover { background: var(--backgroundHover); }",
                    "generatedCss" => ".j-sm-2 { background: var(--backgroundNormal); color: var(--text); border-radius: var(--radius); &:hover { background: var(--backgroundHover); } }",
                    "suggestedFor" => ["Button"],
                    "vars" => [
                        (object) ["varName" => "backgroundNormal", "type" => "color", "label" => "Background normal",
                                    "defaultValue" => (object) ["data" => "#01e717eff", "type" => "hexa"]],
                        (object) ["varName" => "backgroundHover", "type" => "color", "label" => "Background hover",
                                    "defaultValue" => (object) ["data" => "#22808eff", "type" => "hexa"]],
                        (object) ["varName" => "text", "type" => "color", "label" => "Text",
                                    "defaultValue" => (object) ["data" => "#ffffffff", "type" => "hexa"]],
                        (object) ["varName" => "radius", "type" => "length", "label" => "Radius",
                                    "defaultValue" => (object) ["num" => 20, "unit" => "px"]],
                    ]
                ]
            ];
            $this->styleUnitVarValues = [
                (object) [
                    "id" => "j-svv-1",
                    "styleUnitMetaId" => $this->styleUnitMetas[0]->id,
                    "values" => [
                        (object) ["varName" => "padding", "value" => "1rem"]
                    ],
                    "generatedCss" => ".j-svv-1 { --padding: 1rem; }",
                ],
                (object) [
                    "id" => "j-svv-2",
                    "styleUnitMetaId" => $this->styleUnitMetas[0]->id,
                    "values" => [
                        (object) ["varName" => "padding", "value" => "0.4rem"]
                    ],
                    "generatedCss" => ".j-svv-2 { --padding: 0.4rem; }",
                ],
                (object) [
                    "id" => "j-svv-3",
                    "styleUnitMetaId" => $this->styleUnitMetas[1]->id,
                    "values" => [
                        (object) ["varName" => "backgroundNormal", "value" => "#2aaf95"],
                        (object) ["varName" => "backgroundHover", "value" => "#3bc4a9"],
                    ],
                    "generatedCss" => ".j-svv-3 { --backgroundNormal: #2aaf95; --backgroundHover: #3bc4a9; }",
                ]
            ];
        }
        unset($this->themeGlobalStylesJson);
        unset($this->themeStylesOrderJson);
        $this->__stash = [];
    }
}
