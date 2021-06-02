<?php declare(strict_types=1);

namespace KuuraCms\Defaults;

use KuuraCms\Block\BlockTypeInterface;
use KuuraCms\Entities\{BlockProperties, BlockProperty};

final class FormattedTextBlockType implements BlockTypeInterface {
    public function getDefaultRenderer(): string {
        return 'auto';
    }
    public function defineProperties(): BlockProperties {
        $out = new BlockProperties;
        $p1 = new BlockProperty;
        $p1->html = 'text';
        $p1->dataType = 'text';
        $out[] = $p1;
        return $out;
    }
}
