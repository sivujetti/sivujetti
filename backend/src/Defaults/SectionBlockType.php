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
        $p1->name = 'cssClass';
        $p1->dataType = 'text';
        $out[] = $p1;
        return $out;
    }
}
