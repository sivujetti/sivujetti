<?php declare(strict_types=1);

namespace KuuraCms\BlockType;

use KuuraCms\BlockType\Entities\{BlockProperty};

final class HeadingBlockType implements BlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(): \ArrayObject {
        $out = new \ArrayObject;
        $p1 = new BlockProperty;
        $p1->name = "text";
        $p1->dataType = BlockProperty::DATA_TYPE_TEXT;
        $out[] = $p1;
        $p2 = new BlockProperty;
        $p2->name = "level";
        $p2->dataType = BlockProperty::DATA_TYPE_UINT;
        $out[] = $p2;
        $p3 = new BlockProperty;
        $p3->name = "cssClass";
        $p3->dataType = BlockProperty::DATA_TYPE_TEXT;
        $out[] = $p3;
        return $out;
    }
}
