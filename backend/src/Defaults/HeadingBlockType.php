<?php declare(strict_types=1);

namespace KuuraCms\Defaults;

use KuuraCms\Block\BlockTypeInterface;
use KuuraCms\Entities\{BlockProperties, BlockProperty};

final class HeadingBlockType implements BlockTypeInterface { // add separate LocalDbBlockTypeInterface?
    public function getDefaultRenderer(): string {
        return 'kuura:auto';
    }
    public function defineProperties(): BlockProperties {
        // todo BlockPropertiesBuilder ??
        $out = new BlockProperties;
        $p1 = new BlockProperty;
        $p1->name = 'text';
        $p1->dataType = 'text';
        $out[] = $p1;
        $p2 = new BlockProperty;
        $p2->name = 'level';
        $p2->dataType = 'int';
        $out[] = $p2;
        return $out;
    }
}
