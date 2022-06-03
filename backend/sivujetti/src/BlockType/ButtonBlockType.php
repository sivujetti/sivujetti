<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

final class ButtonBlockType implements BlockTypeInterface {
    public const TAG_TYPE_LINK = "link";
    public const TAG_TYPE_NORMAL_BUTTON = "button";
    public const TAG_TYPE_SUBMIT_BUTTON = "submit";
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("html", $builder::DATA_TYPE_TEXT)
            ->newProperty("linkTo")->dataType($builder::DATA_TYPE_TEXT, isNullable: true, validationRules: [
                ["pageUrl", ["allowExternal" => true]]
            ])
            ->newProperty("tagType")->dataType($builder::DATA_TYPE_TEXT, validationRules: [
                ["in", [self::TAG_TYPE_LINK, self::TAG_TYPE_NORMAL_BUTTON, self::TAG_TYPE_SUBMIT_BUTTON]]
            ])
            ->newProperty("cssClass", $builder::DATA_TYPE_TEXT)
            ->getResult();
    }
}
