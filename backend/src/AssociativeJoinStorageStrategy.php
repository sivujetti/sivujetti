<?php declare(strict_types=1);

namespace KuuraCms;

use KuuraCms\Block\Entities\Block;
use KuuraCms\Page\Entities\Page;
use KuuraCms\PageType\Entities\PageType;
use Pike\Db;

class AssociativeJoinStorageStrategy implements StorageStrategy {
    private Db $db;
    public function __construct(Db $db) {
        $this->db = $db;
    }
    public function recreateSchema(): void {
        // todo exec schema-assoc.sqlite.sql
    }
    public function select(PageType $pageType, $temp1, $temp2, $dd): ?Page {
        $rows = $this->sadosdo($pageType, $temp1, $temp2, $dd);
        if (!$rows)
            return null;
        return $this->temp2($rows, $dd);
    }
    public function selectMany(PageType $pageType, $dd): array {
        $rows = $this->sadosdo($pageType, '', '', $dd);
        if (!$rows)
            return [];
        return $this->temp3($rows, $dd);
    }
    private function temp3(array $rows, $dd): array {
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
                $blocks["k-$row->blockId"] = Block::fromDbResult($row, $rows, $this, $dd);
            }
            $rowo->blocks = array_values($blocks);
            $pages["k-$rowo->id"] = $rowo;

        }
        return array_values($pages);
    }
    private function sadosdo(PageType $pageType, $temp1, $temp2, $dd): array {
        [$t1, $t2] = !$temp1
            ? ["", []]
            : [" AND p.$temp1", !is_array($temp2) ? [$temp2] : $temp2];
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
    public function makeBlockFromDbResult(object $row, array $rows, $dd): Block {
        $out = new Block;
        $out->type = $row->blockType;
        $out->section = $row->blockSection;
        $out->renderer = $row->blockRenderer;
        $out->id = $row->blockId;
        $out->path = "{$row->blockParentPath}{$row->blockId}/";
        $out->pageId = $row->id;
        $out->title = $row->blockTitle ?? null;
        $out->children = [];
        foreach ($rows as $row2) {
            if ($row2->blockPropBlockId === $out->id)
                $out->{$row2->blockPropKey} = $row2->blockPropValue;
        }
        return $dd($out);
    }
    public function selectBlocks($section, $temp1, $temp2, $single, $_d, $dd): array {
        $rows = $this->db->fetchAll(
            "SELECT b.`type` AS `blockType`,b.`section` AS `blockSection`,b.`renderer` AS `blockRenderer`,b.`id` AS `blockId`,b.`parentPath` AS `blockParentPath`,b.`pageId` AS `blockPageId`,b.`title` AS `blockTitle`" .
            ",bp.`blockId` AS `blockPropBlockId`,bp.`key` AS `blockPropKey`,bp.`value` AS `blockPropValue`" .
            " FROM `blocks` b" .
            " JOIN `blockProps` bp ON (bp.`blockId` = b.`id`)" .
            " WHERE b.`{$temp1}`=?",
            [$temp2],
            \PDO::FETCH_CLASS,
            '\\stdClass'
        );
        if ($single) {
            $block = Block::fromDbResult($rows[0], $rows, $this, $dd);
            $_d->__invoke($block);
            return $block;
        }
        $k = [];
        foreach ($rows as $row) {
            if (array_key_exists("k-$row->blockId", $k)) continue;
            $k["k-$row->blockId"] = Block::fromDbResult($row, $rows, $this, $dd);
        }
        $blcoks = array_values($k);
        $_d->__invoke($blcoks);
        return $blcoks;
    }
    private function temp2(array $rows, $dd, $i = 0): ?Page {
        $page = $rows[$i];
        $blocks = [];
        foreach ($rows as $row) {
            if (($row->blockPageId !== $page->id && !str_starts_with($row->blockParentPath, "{$page->blockId}/")) ||
                $row->blockSection === '<layout>')
                continue;
            if (array_key_exists("k-$row->blockId", $blocks))
                continue;
            $blocks["k-$row->blockId"] = Block::fromDbResult($row, $rows, $this, $dd);
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
    public static function makeParentPath(string $path): string {
        $level = substr_count($path, '/');
        return $level !== 1
            // 'foo/bar/baz/' -> 'foo/bar/'
            ? substr($path, 0, strrpos(substr($path, 0, strlen($path) - 1), '/')) . '/'
            : '0';
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
    public function up(array $data): void {
        $this->db->beginTransaction();
        //
        [$qList, $values, $_columns] = $this->db->makeInsertQParts($data['theWebsite']);
        $this->db->exec("INSERT INTO `theWebsite` VALUES ({$qList})", $values);
        //
        $v = $data['pageTypes'];
        [$qGroups, $values, $_columns] = $this->db->makeBatchInsertQParts($v);
        $this->db->exec("INSERT INTO `pageTypes` VALUES {$qGroups}", $values);
        //
        $v = $data['pages'];
        [$qGroups, $values, $_columns] = $this->db->makeBatchInsertQParts($v);
        $this->db->exec("INSERT INTO `pages` VALUES {$qGroups}", $values);
        //
        $flat = (object) ['blocks' => [], 'blockProps' => []];
        self::b($data['blocks'], $flat);
        [$qGroups, $values, $_columns] = $this->db->makeBatchInsertQParts($flat->blocks);
        $this->db->exec("INSERT INTO `blocks` VALUES {$qGroups}", $values);
        [$qGroups, $values, $_columns] = $this->db->makeBatchInsertQParts($flat->blockProps);
        $this->db->exec("INSERT INTO `blockProps` VALUES {$qGroups}", $values);
        //
        $this->db->commit();
    }
    private static function b(array $in, object $out): void {
        foreach ($in as $block) {
            $out->blocks[] = $block['data'];
            $out->blockProps = array_merge($out->blockProps, $block['props']);
            if ($block['children']) self::b($block['children'], $out);
        }
    }
}
