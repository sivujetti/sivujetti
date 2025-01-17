<?php declare(strict_types=1);

namespace Sivujetti\Theme\Entities;

use Sivujetti\JsonUtils;

/**
 * @phpstan-type ThemeStyleUnit object{title: string, id: string, scss: string, generatedCss: string, optimizedScss: string|null, optimizedGeneratedCss: string|null, origin: string, specifier: string, isDerivable: bool, derivedFrom: string|null}
 */
final class Style extends \stdClass {
    /** @var list<ThemeStyleUnit> */
    public array $units;
    /** @var string e.g. "Text" */
    public string $blockTypeName;
    /**
     * @param object $row
     * @return $this
     */
    public static function fromParentRs(object $row): Style {
        $out = new self;
        $out->units = JsonUtils::parse($row->themeStylesUnitsJson);
        $out->blockTypeName = $row->themeStylesBlockTypeName;
        return $out;
    }
}
