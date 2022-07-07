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
     * @param string $themeId
     * @return \Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree|null
     */
    public function getSingle(string $globalBlockTreeId,
                              ?string $themeId = null): ?GlobalBlockTree {
        $q = $this->db2->select("\${p}globalBlocks gb", GlobalBlockTree::class);
        $fields = ["gb.`id`", "gb.`name`", "gb.`blocks` AS `blocksJson`"];
        //
        return ($themeId
            ? $q
                ->leftJoin("\${p}globalBlocksStyles gbs ON (gbs.`globalBlockTreeId` = gb.`id` AND gbs.`themeId` = ?)")
                ->fields([...$fields, "gbs.`styles` AS `blockStylesJson`"])
                ->where("gb.`id` = ?", [$themeId, $globalBlockTreeId])
            : $q
                ->fields([...$fields, "NULL AS `blockStylesJson`"])
                ->where("gb.`id` = ?", [$globalBlockTreeId])
        )
            ->mapWith(new class implements RowMapperInterface {
                public function mapRow(object $row, int $_rowNum, array $_rows): ?object {
                    GlobalBlockTreesRepository::normalizeSingle($row);
                    return $row;
                }
            })
            ->limit(20)
            ->fetchAll()[0] ?? null;
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
