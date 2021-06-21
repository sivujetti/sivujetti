<?php declare(strict_types=1);

namespace KuuraCms;

use KuuraCms\Entities\Block;
use KuuraCms\Entities\Page;
use KuuraCms\Entities\PageType;
use Pike\ArrayUtils;
use Pike\Db;

final class EmbeddedDataStorageStrategy implements StorageStrategy {
    private Db $db;
    public function __construct(Db $db) {
        $this->db = $db;
    }
    public function recreateSchema(): void {
        // todo exec schema-embed.sqlite.sql
    }
    public function select(PageType $pageType, $temp1, $temp2, $dd): ?Page {
        return $this->_selectMany($pageType, $temp1, $temp2, $dd)[0] ?? null;
    }
    public function selectMany(PageType $pageType, $dd): array {
        return $this->_selectMany($pageType, '', '', $dd);
    }
    public function _selectMany(PageType $pageType, $temp1, $temp2, $dd): array {
        [$t1, $t2] = !$temp1
            ? ["", []]
            : [" AND p.$temp1", !is_array($temp2) ? [$temp2] : $temp2];
        $rows = $this->db->fetchAll(
            "SELECT p.`id`,p.`slug`,p.`path`,p.`level`,p.`title`,p.`layout`,p.`blocks` AS `blocksJson`,pt.`name` AS `pageType`" .
            " FROM `pages` p" .
            " JOIN `pageTypes` pt ON (pt.`id` = p.`pageTypeId`)" .
            " WHERE pt.`name` = ?$t1",
            array_merge([$pageType->name], $t2),
            \PDO::FETCH_CLASS,
            Page::class
        );
        if (!$rows)
            return [];
        foreach ($rows as $page) {
            $page->blocks = [];
            foreach (json_decode($page->blocksJson) as $blockData)
                $page->blocks[] = Block::fromDbResult($blockData, [], $this, $dd);
            unset($page->blocksJson);
        }
        return $rows;
    }
    public function selectBlocks($section, $temp1, $temp2, $single, $_d, $dd): array {
        if ($section !== '<layout>') throw new \RuntimeException('');

        $row = $this->db->fetchOne("SELECT `data` FROM `layoutBlocks`", [], \PDO::FETCH_ASSOC);
        if (!$row || !($blocks = json_decode($row['data']))) return [];

        $rows = ArrayUtils::filterByKey($blocks, $temp2, $temp1);

        if ($single) {
            $block = Block::fromDbResult($rows[0], [], $this, $dd);
            $_d->__invoke($block);
            return $block;
        }

        $k = [];
        foreach ($rows as $row)
            $k[] = Block::fromDbResult($row, [], $this, $dd);
        $_d->__invoke($k);
        return $k;
    }
    public function makeBlockFromDbResult(object $data, array $rows, $dd): Block {
        $out = new Block;
        $out->type = $data->type;
        $out->section = $data->section;
        $out->renderer = $data->renderer;
        $out->id = strval($data->id);
        $out->path = "{$data->parentPath}{$data->id}/";
        $out->title = $data->title ?? null;
        $out->children = $data->children ? array_map(fn($b) =>
            $this->makeBlockFromDbResult($b, $rows, $dd)
        , $data->children) : [];
        foreach ($data->props as $prop)
            $out->{$prop->key} = $prop->val;
        return $dd($out);
    }
    public function update($pageId, $data): void {
        //
    }
    public function delete($pageId, $temp): void {
        //
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
        $p = self::p($data);
        [$qGroups, $values, $_columns] = $this->db->makeBatchInsertQParts($p);
        $this->db->exec("INSERT INTO `pages` VALUES {$qGroups}", $values);
        //
        $v = json_encode(self::l($data));
        $this->db->exec("INSERT INTO `layoutBlocks` VALUES (?)", [$v]);
        //
        $this->db->commit();
    }
    private static function p(array $in): array {

        foreach ($in['pages'] as $page) {
            $out[] = [
                $page[0],
                $page[1],
                $page[2],
                $page[3],
                $page[4],
                $page[5],
                json_encode(self::b(self::getBlocksForPage($in, $page[0]))),
                $page[6],                
                $page[7],                
            ];
        }
        return $out;
    }
    private static function getBlocksForPage(array $in, $pageId):  array {
        $out = [];
        foreach ($in['blocks'] as $block) {
            if ($block['data'][5] === $pageId && $block['data'][3] !== '<layout>') $out[] = $block;
        }
        return $out;
    }
    private static function l(array $in): array {
        return self::b(self::getBlocksForLayout($in));
    }
    private static function getBlocksForLayout(array $in):  array {
        $out = [];
        foreach ($in['blocks'] as $block) {
            if ($block['data'][3] === '<layout>') $out[] = $block;
        }
        return $out;
    }
    private static function b(array $blocks): array {
        $out = [];
        foreach ($blocks as $block) {
            $out[] = (object) [
                'id' => $block['data'][0],
                'parentPath' => $block['data'][1],
                'type' => $block['data'][2],
                'section' => $block['data'][3],
                'renderer' => $block['data'][4],
                'pageId' => $block['data'][5],
                'title' => $block['data'][6],
                'props' => array_map(fn ($prop) => (object) [
                    'id' => $prop[0],
                    'key' => $prop[1],
                    'val' => $prop[2],
                    'blockId' => $prop[3],
                ], $block['props']),
                'children' => self::b($block['children']),
            ];
        }
        return $out;
    }
}
