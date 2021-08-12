<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

final class ButtonBlockType implements BlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("html", $builder::DATA_TYPE_TEXT)
            ->newProperty("linkTo", $builder::DATA_TYPE_TEXT)
            ->newProperty("cssClass", $builder::DATA_TYPE_TEXT)
            ->getResult();
    }
}
