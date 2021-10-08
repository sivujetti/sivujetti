<?php declare(strict_types=1);

namespace Sivujetti\GlobalBlockTree;

use Pike\Db;

final class GlobalBlockTreesRepository {
    /** @var \Pike\Db */
    private Db $db;
    /**
     * @param \Pike\Db $db
     */
    public function __construct(Db $db) {
        $this->db = $db;
    }
    /**
     * @param object $data
     * @return string $lastInsertId or ""
     */
    public function insert(object $data): string {
        [$qList, $values, $columns] = $this->db->makeInsertQParts($data);
        return $this->db->exec("INSERT INTO `\${p}globalBlocks` ({$columns})" .
                               " VALUES ({$qList})", $values) ? $this->db->lastInsertId() : "";
    }
}
