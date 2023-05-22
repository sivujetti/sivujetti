<?php declare(strict_types=1);

namespace Sivujetti\Block;

/**
 * @template BlockCls
 */
final class BlockTree {
    /**
     * @param string $id
     * @param BlockCls[] $branch
     * @return ?BlockCls
     */
    public static function findBlockById(string $id, array $branch): ?object {
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
     * @param BlockCls[] $blocks
     * @param callable $predicate callable(BlockCls $block): bool
     * @return ?BlockCls
     */
    public static function findBlock(array $branch, callable $predicate): ?object {
        return self::findBlockAndTree($branch, $predicate)[0];
    }
    /**
     * @param BlockCls[] $blocks
     * @param callable $predicate callable(BlockCls $block): bool
     * @param ?object{id: string, blocks: BlockCls[]} $tree = null
     * @return array{0: BlockCls|null, 1: object{id: string, blocks: BlockCls[]}}
     */
    public static function findBlockAndTree(array $branch, callable $predicate, ?object $tree = null): array {
        foreach ($branch as $block) {
            if (call_user_func($predicate, $block))
                return [$block, $tree ?? (object) ["id" => "main", "blocks" => $branch]];
            $sub = $block->type !== "GlobalBlockReference" ? $block->children : $block->__globalBlockTree?->blocks ?? [];
            if ($sub) {
                $tree2 = $block->type !== "GlobalBlockReference" ? $tree ?? (object) ["id" => "main", "blocks" => $branch] : $block->__globalBlockTree;
                $pair = self::findBlockAndTree($sub, $predicate, $tree2);
                if ($pair[0]) return $pair;
            }
        }
        return [null, $tree ?? (object) ["id" => "main", "blocks" => $branch]];
    }
    /**
     * @param BlockCls[] $blocks
     * @param callable $predicate callable(BlockCls $block): bool
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
     * @param BlockCls[] $blocks
     * @param callable $predicate callable(BlockCls $block): bool
     * @param bool $recursive = true
     * @return BlockCls[]
     */
    public static function filterBlocks(array $branch, callable $predicate, bool $recursive = true): array {
        $out = [];
        foreach ($branch as $block) {
            if (call_user_func($predicate, $block)) $out[] = $block;
            if ($recursive && $block->children) {
                $c = self::filterBlocks($block->children, $predicate, true);
                if ($c) $out = array_merge($out, $c);
            }
        }
        return $out;
    }
    /**
     * @param BlockCls[] $branch
     * @return string
     */
    public static function toJson(array $blocks): string {
        return json_encode($blocks, JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
    }
}
