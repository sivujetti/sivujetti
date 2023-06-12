<?php declare(strict_types=1);

namespace Sivujetti\Theme\Entities;

use Pike\Db\NoDupeRowMapper;
use Sivujetti\JsonUtils;

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
                        (object) ["varName" => "padding", "type" => "length", "label" => "Padding", "defaultValue" => null]
                    ]
                ],
                (object) [
                    "id" => "j-sm-2",
                    "title" => "Buttons",
                    "scssTmpl" => "background: var(--backgroundNormal); color: var(--text); border-radius: var(--radius); &:hover { background: var(--backgroundHover); }",
                    "generatedCss" => ".j-sm-2 { background: var(--backgroundNormal); color: var(--text); border-radius: var(--radius); } .j-sm-2:hover { background: var(--backgroundHover); }",
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
            $this->styleUnitVarValues = JsonUtils::parse($row->styleUnitVarValsJson);
        }
        unset($this->themeStylesOrderJson);
        unset($this->styleUnitVarValsJson);
        $this->__stash = [];
    }
}
