<?php declare(strict_types=1);

namespace KuuraCms\Defaults;

use KuuraCms\Block\BlockTypeInterface;
use KuuraCms\Block\Entities\{BlockProperties, BlockProperty};

class SectionBlockType implements BlockTypeInterface {
    public function getTemplates(): array {
        return ['kuura:generic-wrapper'];
    }
    public function defineProperties(): BlockProperties {
        $out = new BlockProperties;
        $p1 = new BlockProperty;
        $p1->name = 'bgImage';
        $p1->dataType = 'text';
        $out[] = $p1;
        $p2 = new BlockProperty;
        $p2->name = 'cssClass';
        $p2->dataType = 'text';
        $out[] = $p2;
        return $out;
    }
}
