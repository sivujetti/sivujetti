<?php declare(strict_types=1);

namespace KuuraCms\Block;

use KuuraCms\Entities\Block;
use Pike\{Db};

final class BlocksRepository {
    private Db $db;
    private array $results;
    public function __construct(Db $db) {
        $this->db = $db;
        $this->results = [];
    }
    public function fetchOne(): SelectBlocksQuery {
        return new SelectBlocksQuery($this->db, function ($b) { $this->results = array_merge($this->results, $b); }, true);
    }
    public function fetchAll(): SelectBlocksQuery {
        return new SelectBlocksQuery($this->db, function ($b) { $this->results = array_merge($this->results, $b); });
    }
    public function getResults(): array {
        return $this->results;
    }
}

final class SelectBlocksQuery {
    private Db $r;
    private $_d;
    private bool $single;
    private array $wheretemp = [];
    public function __construct(Db $r, $d, ?bool $single = null) {
        $this->r = $r;
        $this->_d = $d;
        $this->single = $single ?? false;
    }
    public function where(string $prop, $val): SelectBlocksQuery {
        $this->wheretemp = [$prop, $val];
        return $this;
    }
    public function exec(): object|array|null {
        $rows = (new AssociativeJoinStorageStrategy($this->r))->select("b.`{$this->wheretemp[0]}`=?", $this->wheretemp[1]);
        if ($this->single) {
            $block = Block::fromDbResult($rows[0], $rows);
            $this->_d->__invoke($block);
            return $block;
        }
        $k = [];
        foreach ($rows as $row) {
            if (array_key_exists("k-$row->blockId", $k)) continue;
            $k["k-$row->blockId"] = Block::fromDbResult($row, $rows);
        }
        $blcoks = array_values($k);
        $this->_d->__invoke($blcoks);
        return $blcoks;
    }
}

interface StorageStrategy
{
    public function select($temp1, $temp2): array;
}

class AssociativeJoinStorageStrategy implements StorageStrategy {
    public function __construct(Db $db)
    {
        $this->db = $db;
    }
    public function select($temp1, $temp2): array
    {
        return $this->db->fetchAll(
            "SELECT b.`type` AS `blockType`,b.`section` AS `blockSection`,b.`renderer` AS `blockRenderer`,b.`id` AS `blockId`,b.`pageId` AS `blockPageId`,b.`title` AS `blockTitle`" .
            ",bp.`blockId` AS `blockPropBlockId`,bp.`key` AS `blockPropKey`,bp.`value` AS `blockPropValue`" .
            " FROM `blocks` b" .
            " JOIN `blockProps` bp ON (bp.`blockId` = b.`id`)" .
            " WHERE $temp1",
            [$temp2],
            \PDO::FETCH_CLASS,
            '\\stdClass'
        );
    }
}
