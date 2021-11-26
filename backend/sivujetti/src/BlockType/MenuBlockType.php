<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

final class MenuBlockType implements BlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("tree", $builder::DATA_TYPE_TEXT)
            ->newProperty("wrapStart", $builder::DATA_TYPE_TEXT)
            ->newProperty("wrapEnd", $builder::DATA_TYPE_TEXT)
            ->newProperty("treeStart", $builder::DATA_TYPE_TEXT)
            ->newProperty("treeEnd", $builder::DATA_TYPE_TEXT)
            ->newProperty("itemStart", $builder::DATA_TYPE_TEXT)
            ->newProperty("itemAttrs", $builder::DATA_TYPE_TEXT)
            ->newProperty("itemEnd", $builder::DATA_TYPE_TEXT)
            ->getResult();
    }
}
