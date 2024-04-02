<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

/** @deprecated Use TextBlockType */
final class HeadingBlockType implements BlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("text", $builder::DATA_TYPE_TEXT)
            ->newProperty("level")->dataType($builder::DATA_TYPE_UINT, validationRules: [
                ["in", [1, 2, 3, 4, 5, 6]]
            ])
            ->getResult();
    }
}
