<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

final class PageInfoBlockType implements BlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("overrides", $builder::DATA_TYPE_TEXT)
            ->getResult();
    }
}
