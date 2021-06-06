<?php declare(strict_types=1);

namespace KuuraCms\Block;

use KuuraCms\Entities\Block;
use Pike\{Db};

final class BlocksRepository {
    private Db $db;
    public function __construct(Db $db) {
        $this->db = $db;
    }
    public function fetchOne(): SelectBlocksQuery {
        return new SelectBlocksQuery($this->db);
    }
}

final class SelectBlocksQuery {
    private Db $r;
    private array $wheretemp = [];
    public function __construct(Db $r) {
        $this->r = $r;
    }
    public function where(string $prop, $val): SelectBlocksQuery {
        $this->wheretemp = [$prop, $val];
        return $this;
    }
    public function exec(): ?object {
        $rows = (new AssociativeJoinStorageStrategy($this->r))->select("b.`{$this->wheretemp[0]}`=?", $this->wheretemp[1]);
        return Block::fromDbResult($rows[0], $rows);
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
