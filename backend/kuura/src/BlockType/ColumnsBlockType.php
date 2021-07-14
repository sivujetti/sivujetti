<?php declare(strict_types=1);

namespace KuuraCms\BlockType;

use KuuraCms\BlockType\Entities\{BlockProperty};

final class ColumnsBlockType implements BlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(): \ArrayObject {
        $out = new \ArrayObject;
        $p1 = new BlockProperty;
        $p1->name = "cssClass";
        $p1->dataType = BlockProperty::DATA_TYPE_TEXT;
        $out[] = $p1;
        return $out;
    }
}
