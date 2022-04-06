<?php declare(strict_types=1);

namespace Sivujetti\Block;

use Sivujetti\Block\Entities\Block;

final class BlockTree {
    /**
     * @param string $id
     * @param \Sivujetti\Block\Entities\Block[] $branch
     * @return ?\Sivujetti\Block\Entities\Block
     */
    public static function findBlockById(string $id, array $branch): ?Block {
        foreach ($branch as $block) {
            if ($block->id === $id) return $block;
            if ($block->children) {
                $c = self::findBlockById($id, $block->children);
                if ($c) return $c;
            }
        }
        return null;
    }
    /**
     * @param \Sivujetti\Block\Entities\Block[] $blocks
     * @param callable $predicate callable(\Sivujetti\Block\Entities\Block $block): bool
     * @return ?\Sivujetti\Block\Entities\Block
     */
    public static function findBlock(array $branch, callable $predicate): ?Block {
        foreach ($branch as $block) {
            if (call_user_func($predicate, $block)) return $block;
            if ($block->children) {
                $c = self::findBlock($block->children, $predicate);
                if ($c) return $c;
            }
        }
        return null;
    }
    /**
     * @param \Sivujetti\Block\Entities\Block[] $blocks
     * @param callable $predicate callable(\Sivujetti\Block\Entities\Block $block): bool
     */
    public static function traverse(array $branch, callable $fn): void {
        foreach ($branch as $i => $block) {
            if (call_user_func($fn, $block, $i) === false)
                return;
            if ($block->children)
                self::traverse($block->children, $fn);
        }
    }
    /**
     * @param \Sivujetti\Block\Entities\Block[] $blocks
     * @param callable $predicate callable(\Sivujetti\Block\Entities\Block $block): bool
     * @return \Sivujetti\Block\Entities\Block[]
     */
    public static function filterBlocks(array $branch, callable $predicate): array {
        $out = [];
        foreach ($branch as $block) {
            if (call_user_func($predicate, $block)) $out[] = $block;
            if ($block->children) {
                $c = self::filterBlocks($block->children, $predicate);
                if ($c) $out = array_merge($out, $c);
            }
        }
        return $out;
    }
    /**
     * @param \Sivujetti\Block\Entities\Block[] $branch
     * @return string
     */
    public static function toJson(array $blocks): string {
        return json_encode($blocks, JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
    }
}
