<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

class ImageBlockType implements BlockTypeInterface {
    const PLACEHOLDER_SRC = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAD6AQMAAAAho+iwAAAABlBMVEX19fUzMzO8wlcyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAIElEQVRoge3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAD8GJhYAATKiH3kAAAAASUVORK5CYII=";
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("src")
                ->dataType($builder::DATA_TYPE_TEXT, isNullable: true, validationRules: [["notContains", "/", "string"]])
            ->newProperty("altText", $builder::DATA_TYPE_TEXT)
            ->getResult();
    }
}
