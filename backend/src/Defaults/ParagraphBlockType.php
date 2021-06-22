<?php declare(strict_types=1);

namespace KuuraCms\Defaults;

use KuuraCms\Block\BlockTypeInterface;
use KuuraCms\Block\Entities\{BlockProperties, BlockProperty};

final class ParagraphBlockType implements BlockTypeInterface {
    public function getTemplates(): array {
        return ['kuura:auto'];
    }
    public function defineProperties(): BlockProperties {
        $out = new BlockProperties;
        $p1 = new BlockProperty;
        $p1->name = 'text';
        $p1->dataType = 'text';
        $out[] = $p1;
        return $out;
    }
}
