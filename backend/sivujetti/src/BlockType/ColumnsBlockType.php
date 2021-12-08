<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

final class ColumnsBlockType implements BlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("numColumns", $builder::DATA_TYPE_UINT)
            ->newProperty("takeFullWidth", $builder::DATA_TYPE_UINT)
            ->newProperty("cssClass", $builder::DATA_TYPE_TEXT)
            ->getResult();
    }
}
