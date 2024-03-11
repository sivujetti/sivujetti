<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Sivujetti\Page\WebPageAwareTemplate;

use function Sivujetti\createElement as el;

class ImageBlockType implements BlockTypeInterface {
    const PLACEHOLDER_SRC = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAD6AQMAAAAho+iwAAAABlBMVEX19fUzMzO8wlcyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAIElEQVRoge3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAD8GJhYAATKiH3kAAAAASUVORK5CYII=";
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("src")
                ->dataType($builder::DATA_TYPE_TEXT, isNullable: true, validationRules: [
                    ["notContains", "./", "string"],
                ])
            ->newProperty("altText", $builder::DATA_TYPE_TEXT)
            ->newProperty("caption", $builder::DATA_TYPE_TEXT)
            ->getResult();
    }
    /**
     * @inheritdoc
     */
    public function render(object $block, 
                           \Closure $createDefaultProps, 
                           \Closure $renderChildren,
                           WebPageAwareTemplate $tmpl): array {
        return el("figure", $createDefaultProps(),
            el("img", [
                "src" => $block->src ? $tmpl->maybeExternalMediaUrl($block->src) : self::PLACEHOLDER_SRC,
                "alt" => $block->altText,
            ], ""),
            $block->caption ? el("figcaption", null, $block->caption) : "",
            ...$renderChildren()
        );
    }
    /**
     * @param \Sivujetti\Page\WebPageAwareTemplate $tmpl
     * @param string|null $src
     * @param string $default = self::PLACEHOLDER_SRC
     * @return string
     */
    public static function createSrc(WebPageAwareTemplate $tmpl,
                                     ?string $src,
                                     string $default = self::PLACEHOLDER_SRC): string {
        return $src
            ? $tmpl->maybeExternalMediaUrl($src)
            : $default;
    }
}
