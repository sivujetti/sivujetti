<?php declare(strict_types=1);

namespace KuuraCms\Defaults;

use KuuraCms\Block\BlockTypeInterface;
use KuuraCms\Entities\{BlockProperties, BlockProperty};

final class MenuBlockType implements BlockTypeInterface {
    public function getTemplates(): array {
        return ['kuura:menu'];
    }
    public function defineProperties(): BlockProperties {
        $out = new BlockProperties;
        $p1 = new BlockProperty;
        $p1->name = 'tree';
        $p1->dataType = 'text';
        $out[] = $p1;
        $p2 = new BlockProperty;
        $p2->name = 'treeStart';
        $p2->dataType = 'text';
        $out[] = $p2;
        $p3 = new BlockProperty;
        $p3->name = 'itemStart';
        $p3->dataType = 'text';
        $out[] = $p3;
        return $out;
    }
}
