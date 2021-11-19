<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

class ImageBlockType implements BlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("src", $builder::DATA_TYPE_TEXT)
            ->newProperty("cssClass", $builder::DATA_TYPE_TEXT)
            ->getResult();
    }
}
