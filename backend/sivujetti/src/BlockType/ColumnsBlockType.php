<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

class ColumnsBlockType implements BlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return self::addProperties($builder)->getResult();
    }
    /**
     */
    public static function addProperties(PropertiesBuilder $to): PropertiesBuilder {
        return $to
            ->newProperty("numColumns", $to::DATA_TYPE_UINT)
            ->newProperty("takeFullWidth", $to::DATA_TYPE_UINT);
    }
}
