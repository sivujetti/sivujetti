<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

/** @deprecated */
final class ParagraphBlockType implements BlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("text")->dataType($builder::DATA_TYPE_TEXT, validationRules: [
                ["maxLength", 128000]
            ])
            ->getResult();
    }
}
