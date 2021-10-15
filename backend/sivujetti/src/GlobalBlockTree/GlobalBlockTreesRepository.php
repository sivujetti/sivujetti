<?php declare(strict_types=1);

namespace Sivujetti\GlobalBlockTree;

use Pike\Db;
use Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree;
use Sivujetti\Page\PagesRepository;

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
    /**
     * @param string $globalBlockTreeId
     * @return \Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree|null
     */
    public function getSingle(string $globalBlockTreeId): ?GlobalBlockTree {
        $rows = $this->db->fetchAll("SELECT `id`, `name`, `blocks` AS `blocksJson`" .
                                    " FROM `\${p}globalBlocks` WHERE `id` = ?",
                                    [$globalBlockTreeId],
                                    \PDO::FETCH_CLASS,
                                    GlobalBlockTree::class);
        if (!$rows) return null;
        return $this->normalizeRs($rows)[0];
    }
    /**
     * @param string $id
     * @param object $data
     * @param bool $doInsertRevision = false
     * @return int $numAffectedRows
     */
    public function updateById(string $id, object $data, bool $updateTreeOnly = true): int {
        if ($updateTreeOnly !== true)
            throw new \RuntimeException("");
        return $this->db->exec("UPDATE `\${p}globalBlocks` SET `blocks` = ? WHERE `id` = ?",
                               [$data->blocks, $id]);
    }
    /**
     * @param \Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree[]
     * @return \Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree[]
     */
    private function normalizeRs(array $rows): array {
        foreach ($rows as $row) {
            $row->blocks = $row->blocksJson ? PagesRepository::blocksFromRs("blocksJson", $row) : null;
        }
        return $rows;
    }
}
