<?php declare(strict_types=1);

namespace Sivujetti\Theme\Entities;

final class Theme {
    /** @var string */
    public string $id;
    /** @var string */
    public string $name;
    /** @var object[] [{name: string, friendlyName: string, value: {type: "color", value: string[]}}] */
    public array $globalStyles;
    /**
     * @param object $row
     * @return self
     */
    public static function fromParentRs(object $row): Theme {
        $out = new self;
        $out->id = "1";
        $out->name = $row->themeName;
        $out->globalStyles = json_decode($row->themeGlobalStylesJson, flags: JSON_THROW_ON_ERROR);
        return $out;
    }
}
