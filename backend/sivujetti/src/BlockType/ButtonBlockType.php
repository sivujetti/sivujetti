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
            ->newProperty("linkTo", $builder::DATA_TYPE_TEXT)
            ->newProperty("tagType", $builder::DATA_TYPE_TEXT)
            ->newProperty("cssClass", $builder::DATA_TYPE_TEXT)
            ->getResult();
    }
}
