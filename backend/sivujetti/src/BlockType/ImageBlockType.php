<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Sivujetti\Page\WebPageAwareTemplate;

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
                    ["notContains", ".%2F", "string"],
                ])
            ->newProperty("altText", $builder::DATA_TYPE_TEXT)
            ->newProperty("caption", $builder::DATA_TYPE_TEXT)
            ->getResult();
    }
    /**
     * @param \Sivujetti\Page\WebPageAwareTemplate $tmpl
     * @param string|null $src
     * @param string $default = self::PLACEHOLDER_SRC
     * @return string
     */
    public static function createSrc(WebPageAwareTemplate $tmpl, ?string $src, string $default = self::PLACEHOLDER_SRC): string {
        return $src
            ? $tmpl->mediaUrl("public/uploads/" . str_replace("/", "", $src))
            : $default;
    }
}
