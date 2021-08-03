<?php declare(strict_types=1);

namespace KuuraCms\BlockType;

final class ColumnsBlockType implements BlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("cssClass", $builder::DATA_TYPE_TEXT)
            ->getResult();
    }
}
