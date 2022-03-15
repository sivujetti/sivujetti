<?php declare(strict_types=1);

namespace Sivujetti\BlockType\Entities;

final class BlockTypeStyles {
    /** @var string \Sivujetti\Block\Entities\Block::TYPE_* */
    public string $blockTypeName;
    /** @var string */
    public string $styles;
    /**
     * @param object $row
     * @return self
     */
    public static function fromParentRs(object $row): BlockTypeStyles {
        $out = new self;
        $out->blockTypeName = $row->themeBlockTypeStylesBlockTypeName;
        $out->styles = $row->themeBlockTypeStylesStyles;
        return $out;
    }
}
