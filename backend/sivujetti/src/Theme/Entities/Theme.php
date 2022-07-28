<?php declare(strict_types=1);

namespace Sivujetti\Theme\Entities;

use Pike\Db\NoDupeRowMapper;

final class Theme {
    /** @var string */
    public string $id;
    /** @var string */
    public string $name;
    /** @var object[] [{name: string, friendlyName: string, value: {type: "color", value: string[]}}] */
    public array $globalStyles;
    /** @var \Sivujetti\Theme\Entities\Style[] */
    public array $styles;
    /**
     * @param object $row
     * @param object[] $rows
     * @return self
     */
    public static function fromParentRs(object $row, array $rows): Theme {
        $out = new self;
        $out->id = strval($row->themeId);
        $out->name = $row->themeName;
        $out->globalStyles = json_decode($row->themeGlobalStylesJson, flags: JSON_THROW_ON_ERROR);
        $out->styles = NoDupeRowMapper::collectOnce($rows, fn($row2) =>
            $row2->themeId === $out->id ? Style::fromParentRs($row2) : null
        , "themeStylesBlockTypeName", []);
        return $out;
    }
}
