<?php declare(strict_types=1);

namespace Sivujetti\Theme\Entities;

final class Style {
    /** @var object[] array<int, {title: string, id: string, scss: string, generatedCss: string}> */
    public array $units;
    /** @var string e.g. "Heading" */ 
    public string $blockTypeName;
    /**
     * @param object $row
     * @return self
     */
    public static function fromParentRs(object $row): Style {
        $out = new self;
        $out->units = json_decode($row->themeStylesUnits, flags: JSON_THROW_ON_ERROR);
        $out->blockTypeName = $row->themeStylesBlockTypeName;
        return $out;
    }
}
