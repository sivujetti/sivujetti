<?php declare(strict_types=1);

namespace Sivujetti\Block;

/**
 * @template BlockCls
 * @phpstan-type Tree object{id: string, blocks: list<BlockCls>}
 */
final class BlockTree {
    /**
     * @param string $id
     * @param list<BlockCls> $branch
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
     * @param list<BlockCls> $blocks
     * @param callable(BlockCls, Tree, int): bool $predicate
     * @return ?BlockCls
     */
    public static function findBlock(array $branch, callable $predicate): ?object {
        return self::findBlockAndTree($branch, $predicate)[0];
    }
    /**
     * @param list<BlockCls> $blocks
     * @param callable(BlockCls, Tree, int): bool $predicate
     * @param ?Tree $tree = null
     * @return array{0: BlockCls|null, 1: Tree}
     */
    public static function findBlockAndTree(array $branch, callable $predicate, ?object $tree = null): array {
        $treeNorm = $tree ?? (object) ["id" => "main", "blocks" => $branch];
        $closure = $predicate(...);
        foreach ($branch as $i => $block) {
            if ($closure($block, $tree, $i))
                return [$block, $treeNorm];
            if ($block->type !== "GlobalBlockReference" && ($c = $block->children))
                $pair = self::findBlockAndTree($c, $closure, $treeNorm);
            elseif ($block->type === "GlobalBlockReference" && ($gbt = $block->__globalBlockTree ?? null))
                $pair = self::findBlockAndTree($gbt->blocks, $closure, $gbt);
            else
                $pair = [null];
            if ($pair[0]) return $pair;
        }
        return [null, $treeNorm];
    }
    /**
     * @param list<BlockCls> $blocks
     * @param callable(BlockCls, Tree, int): bool $fn
     */
    public static function traverse(array $branch, callable $fn): void {
        self::traverseWithTrees($branch, $fn);
    }
    /**
     * @param list<BlockCls> $blocks
     * @param callable(BlockCls, Tree, int): bool $fn
     * @param ?Tree $tree = null
     */
    public static function traverseWithTrees(array $branch, callable $fn, ?object $tree = null): void {
        $closure = $fn(...);
        $treeNorm = $tree ?? (object) ["id" => "main", "blocks" => $branch];
        foreach ($branch as $i => $block) {
            if ($closure($block, $treeNorm, $i) === false)
                return;
            if ($block->type !== "GlobalBlockReference" && ($c = $block->children))
                self::traverseWithTrees($c, $closure, $treeNorm);
            elseif ($block->type === "GlobalBlockReference" && ($gbt = $block->__globalBlockTree ?? null))
                self::traverseWithTrees($gbt->blocks, $closure, $gbt);
        }
    }
    /**
     * @param list<BlockCls> $blocks
     * @param callable(BlockCls, Tree, int): bool $predicate
     * @return list<BlockCls>
     */
    public static function filterBlocks(array $branch, callable $predicate): array {
        return self::filterBlockWithTrees($branch, $predicate)[0];
    }
    /**
     * @param list<BlockCls> $branch
     * @param callable(BlockCls, Tree, int): bool $predicate
     * @param ?Tree $tree = null
     * @return array{0: list<BlockCls>, 1: list<Tree>}
     */
    public static function filterBlockWithTrees(array $branch, callable $predicate, ?object $tree = null): array {
        $out = [[], []];
        $closure = $predicate(...);
        $treeNorm = $tree ?? (object) ["id" => "main", "blocks" => $branch];
        foreach ($branch as $i => $block) {
            if ($closure($block, $treeNorm, $i)) {
                $out[0][] = $block;
                $out[1][] = $treeNorm;
            }
            if ($block->type !== "GlobalBlockReference" && ($c = $block->children))
                $subArr = self::filterBlockWithTrees($c, $closure, $treeNorm);
            elseif ($block->type === "GlobalBlockReference" && ($gbt = $block->__globalBlockTree))
                $subArr = self::filterBlockWithTrees($gbt->blocks, $closure, $gbt);
            else
                $subArr = [[], []];
            if ($subArr[0]) {
                $out[0] = [...$out[0], ...$subArr[0]];
                $out[1] = [...$out[1], ...$subArr[1]];
            }
        }
        return $out;
    }
}
