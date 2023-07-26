<?php declare(strict_types=1);

namespace Sivujetti\Theme\Entities;

use Sivujetti\JsonUtils;

/**
 * @psalm-type ThemeStyleUnit = object{title: string, id: string, scss: string, generatedCss: string, origin: string, specifier: string, isDerivable: bool, derivedFrom: string|null}
 */
final class Style extends \stdClass {
    /** @psalm-var object[] array<int, ThemeStyleUnit> */
    public array $units;
    /** @var string e.g. "Text" */
    public string $blockTypeName;
    /**
     * @param object $row
     * @return self
     */
    public static function fromParentRs(object $row): Style {
        $out = new self;
        $out->units = JsonUtils::parse($row->themeStylesUnitsJson);
        $out->blockTypeName = $row->themeStylesBlockTypeName;
        return $out;
    }
}
