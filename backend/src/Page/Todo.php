<?php declare(strict_types=1);

namespace KuuraCms\Page;

use KuuraCms\Entities\Block;
use KuuraCms\Entities\PageType;
use KuuraCms\Entities\Page;
use KuuraCms\SharedAPIContext;
use Pike\{ArrayUtils, Db, PikeException};

final class Todo {
    public function __construct(Db $db, SharedAPIContext $storage) {
        $this->db = $db;
        $this->pageTypes = $storage->getDataHandle()->pageTypes;
        $this->blockTypes = $storage->getDataHandle()->blockTypes;
    }
    public function tempFetch(string $pageTypeName, $temp1=null, $temp2=null): array {
        if (!($pt = ArrayUtils::findByKey(
            $this->pageTypes,
            $pageTypeName,
            "name"
        ))) throw new PikeException("");

        return (new AssociativeJoinStorageStrategy($this->db))->select($pt, $temp1, $temp2);
    }
    public function temp2(array $rows, $i = 0): ?Page {
        if (!$rows)
            return null;
        $page = $rows[$i];
        $blocks = [];
        foreach ($rows as $row) {
            if ($row->blockPageId !== $page->id ||
                $row->blockSection === '<layout>') // path startswith ??
                continue;
            if (array_key_exists("k-$row->blockId", $blocks))
                continue;
            $b = Block::fromDbResult($row, $rows);
            $makeBlockType = $this->blockTypes[$b->type] ?? null;
            if (!$makeBlockType) continue;
            $blockType = $makeBlockType();
            // todo $blockType->makePropsFromRs()
            if (method_exists($blockType, "fetchData"))
                $makeBlockType()->fetchData($b, $this);
            $blocks["k-$row->blockId"] = $b;
        }
        usort($blocks, fn($a, $b) => strlen($a->path) <=> strlen($b->path));
        $page->blocks = self::treeifyBlocks(array_values($blocks));
        return $page;
    }
    /**
     * https://stackoverflow.com/a/8249047
     * @access private
     */
    private static function treeifyBlocks(array $blocks): array {
        $tree = ['0' => (object) ['path' => '0']];
        for ($i = 0; $i < count($blocks); ++$i) {
            $path = $blocks[$i]->path;
            $tree[$path] = $blocks[$i];
            $tree[self::makeParentPath($path)]->children[] = $tree[$path];
        }
        return $tree['0']->children;
    }
    /**
     * @access private
     */
    private static function makeParentPath(string $path): string {
        $level = substr_count($path, '/');
        return $level !== 1
            // 'foo/bar/baz/' -> 'foo/bar/'
            ? substr($path, 0, strrpos(substr($path, 0, strlen($path) - 1), '/')) . '/'
            : '0';
    }
    public function temp3(array $rows): array {
        if (!$rows)
            return [];
        $pages = [];
        foreach ($rows as $rowo) {
            if (array_key_exists("k-$rowo->id", $pages))
                continue;
            $blocks = [];
            foreach ($rows as $row) {
                if ($row->blockPageId !== $rowo->id)
                    continue;
                if (array_key_exists("k-$row->blockId", $blocks))
                    continue;
                $b = Block::fromDbResult($row, $rows);
                $makeBlockType = $this->blockTypes[$b->type] ?? null;
                if (!$makeBlockType) continue;
                $blockType = $makeBlockType();
                // todo $blockType->makePropsFromRs()
                if (method_exists($blockType, "fetchData"))
                    $makeBlockType()->fetchData($b, $this);
                $blocks["k-$row->blockId"] = $b;
            }
            $rowo->blocks = array_values($blocks);
            $pages["k-$rowo->id"] = $rowo;

        }
        return array_values($pages);
    }
    public function tempDelete($pageId, bool $doDeleteBlocksAsWell): void {
        (new AssociativeJoinStorageStrategy($this->db))->delete($pageId, $doDeleteBlocksAsWell);
    }
    public function tempUpdate($pageId, $data): void {
        (new AssociativeJoinStorageStrategy($this->db))->update($pageId, $data);
    }
}

interface StorageStrategy {
    public function select(PageType $pageType, $temp1, $temp2): array;
}

class AssociativeJoinStorageStrategy implements StorageStrategy {
    public function __construct(Db $db) {
        $this->db = $db;
    }
    public function select(PageType $pageType, $temp1, $temp2): array {
        [$t1, $t2] = !$temp1
            ? ["", []]
            : [" AND p.$temp1", [$temp2]];
        $t = $this->db->attr(\PDO::ATTR_DRIVER_NAME) === 'sqlite' ? "ir.`id` || '/%'" : "CONCAT(ir.`id`, '/%')";
        return $this->db->fetchAll(
            "SELECT p.`id`,p.`slug`,p.`path`,p.`level`,p.`title`,p.`layout`,pt.`name` AS `pageType`" .
            ",b.`type` AS `blockType`,b.`section` AS `blockSection`,b.`renderer` AS `blockRenderer`,b.`id` AS `blockId`,b.`parentPath` AS `blockParentPath`,b.`pageId` AS `blockPageId`,b.`title` AS `blockTitle`" .
            ",bp.`blockId` AS `blockPropBlockId`,bp.`key` AS `blockPropKey`,bp.`value` AS `blockPropValue`" .
            " FROM `pages` p" .
            " JOIN `pageTypes` pt ON (pt.`id` = p.`pageTypeId`)" .
            " JOIN `blocks` ir ON (ir.`pageId` = p.`id`)" . // Note1: ei käytetä
            " LEFT JOIN `blocks` b ON (b.`id` == ir.`id` OR b.`parentPath` LIKE {$t})" . // Note2: sisältää myös "päälohkon" (jonka pageId=p.id)
            " JOIN `blockProps` bp ON (bp.`blockId` = b.`id`)" .
            " WHERE pt.`name` = ?$t1",
            array_merge([$pageType->name], $t2),
            \PDO::FETCH_CLASS,
            Page::class
        );
    }
    public function update($pageId, $data): void {
        [$columns, $values] = $this->db->makeUpdateQParts($data);
        $this->db->exec("UPDATE `pages` SET {$columns} WHERE `id`=?",
                        array_merge($values, [$pageId]));
    }
    public function delete($pageId, $temp): void {
        if ($temp)
            // Note: a database trigger will delete associated rows from blockProps
            $this->db->exec('DELETE FROM `blocks` WHERE `pageId` = ?', [$pageId]);
        $this->db->exec('DELETE FROM `pages` WHERE `id` = ?', [$pageId]);
    }
}
