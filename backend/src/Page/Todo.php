<?php declare(strict_types=1);

namespace KuuraCms\Page;

use KuuraCms\Entities\Block;
use KuuraCms\Entities\Page;
use KuuraCms\SharedAPIContext;
use Pike\{Db};

final class Todo {
    public function __construct(Db $db, SharedAPIContext $storage) {
        $this->db = $db;
        $this->blockTypes = $storage->getDataHandle()->blockTypes;
    }
    public function tempFetchPages($temp1, $temp2): array {
        return $this->db->fetchAll(
            'SELECT p.`title`,p.`template`' .
            ',b.`type` AS `blockType`,b.`section` AS `blockSection`,b.`renderer` AS `blockRenderer`,b.`id` AS `blockId`' .
            ',bp.`blockId` AS `blockPropBlockId`,bp.`key` AS `blockPropKey`,bp.`value` AS `blockPropValue`' .
            ' from `pages` p' .
            ' JOIN `blocks` b ON (b.`pageId` = p.`id`)' .
            ' JOIN `blockProps` bp ON (bp.`blockId` = b.`id`)' .
            " WHERE {$temp1}",
            [$temp2],
            \PDO::FETCH_CLASS,
            Page::class
        );
    }
    public function temp2(array $rows): ?Page {
        if (!$rows)
            return null;
        $page = $rows[0];
        $page->blocks = [];
        foreach ($rows as $row) {
            if (array_reduce($page->blocks, fn($prev, $block) =>
                !$prev ? $block->id === $row->blockId : $prev,
            null)) continue;
            $b = Block::fromDbResult($row, $rows);
            $makeBlockType = $this->blockTypes[$b->type] ?? null;
            if (!$makeBlockType) continue;
            $blockType = $makeBlockType();
            if (method_exists($blockType, 'fetchData'))
                $makeBlockType()->fetchData($b, $this);
            $page->blocks[] = $b;
        }
        return $page;
    }
}
