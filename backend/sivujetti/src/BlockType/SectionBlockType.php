<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

final class SectionBlockType implements BlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("bgImage", $builder::DATA_TYPE_TEXT)
            ->newProperty("cssClass", $builder::DATA_TYPE_TEXT)
            ->getResult();
    }
}
