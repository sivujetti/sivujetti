<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

final class RichTextBlockType implements BlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("html")->dataType($builder::DATA_TYPE_TEXT, validationRules: [
                ["maxLength", 128000]
            ])
            ->getResult();
    }
}
