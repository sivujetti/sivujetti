<?php declare(strict_types=1);

namespace Sivujetti\GlobalBlockTree;

use Pike\Db;
use Pike\Db\FluentDb;
use Pike\Interfaces\RowMapperInterface;
use Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree;
use Sivujetti\Page\PagesRepository;

final class GlobalBlockTreesRepository {
    /** @var \Pike\Db */
    private Db $db;
    /** @var \Pike\Db\FluentDb */
    private FluentDb $db2;
    /**
     * @param \Pike\Db\FluentDb $db
     */
    public function __construct(FluentDb $db) {
        $this->db = $db->getDb();
        $this->db2 = $db;
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
     * @return \Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree[]
     */
    public function getMany(): array {
        $rows = $this->db->fetchAll("SELECT `id`, `name`, `blocks` AS `blocksJson`" .
                                    ", NULL AS `blockStylesJson`" .
                                    " FROM `\${p}globalBlocks`" .
                                    " LIMIT 20",
                                    [],
                                    \PDO::FETCH_CLASS,
                                    GlobalBlockTree::class);
        return $this->normalizeRs($rows);
    }
    /**
     * @param string $globalBlockTreeId
     * @return \Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree|null
     */
    public function getSingle(string $globalBlockTreeId): ?GlobalBlockTree {
        return $this->db2
            ->select("\${p}globalBlocks gb", GlobalBlockTree::class)
            ->fields(["gb.`id`", "gb.`name`", "gb.`blocks` AS `blocksJson`",
                      "gbs.`styles` AS `blockStylesJson`"])
            ->leftJoin("\${p}globalBlockStyles gbs ON (gbs.`globalBlockTreeId` = gb.`id`)")
            ->mapWith(new class implements RowMapperInterface {
                public function mapRow(object $row, int $_rowNum, array $_rows): ?object {
                    GlobalBlockTreesRepository::normalizeSingle($row);
                    return $row;
                }
            })
            ->where("gb.`id` = ?", [$globalBlockTreeId])
            ->limit(20)
            ->fetchAll()[0] ?? null;
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
        foreach ($rows as $row)
            self::normalizeSingle($row);
        return $rows;
    }
    /**
     * @param \Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree $row
     */
    public static function normalizeSingle(object $row): void {
        $row->blocks = $row->blocksJson ? PagesRepository::blocksFromRs("blocksJson", $row) : null;
        $row->blockStyles = $row->blockStylesJson ? json_decode($row->blockStylesJson) : [];
    }
}
