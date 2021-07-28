<?php declare(strict_types=1);

namespace KuuraCms\BlockType;

use KuuraCms\BlockType\Entities\{BlockProperty};

final class ParagraphBlockType implements BlockTypeInterface {
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
        $p2->name = "cssClass";
        $p2->dataType = BlockProperty::DATA_TYPE_TEXT;
        $out[] = $p2;
        return $out;
    }
}
