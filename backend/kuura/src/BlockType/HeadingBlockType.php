<?php declare(strict_types=1);

namespace KuuraCms\BlockType;

final class HeadingBlockType implements BlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("text", $builder::DATA_TYPE_TEXT)
            ->newProperty("level", $builder::DATA_TYPE_UINT)
            ->newProperty("cssClass", $builder::DATA_TYPE_TEXT)
            ->getResult();
    }
}
