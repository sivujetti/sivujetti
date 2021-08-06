<?php declare(strict_types=1);

namespace Sivujetti\Block;

use Sivujetti\Block\Entities\Block;

final class BlockTree {
    /**
     * @param string $id
     * @param \Sivujetti\Block\Entities\Block[] $branch
     * @return ?\Sivujetti\Block\Entities\Block
     */
    public static function findBlock(string $id, array $branch): ?Block {
        foreach ($branch as $block) {
            if ($block->id === $id) return $block;
            if ($block->children) {
                $c = self::findBlock($id, $block->children);
                if ($c) return $c;
            }
        }
        return null;
    }
    /**
     * @param \Sivujetti\Block\Entities\Block[] $branch
     * @return string
     */
    public static function toJson(array $blocks): string {
        return json_encode($blocks, JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
    }
}
