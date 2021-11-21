<?php declare(strict_types=1);

namespace Sivujetti\Layout;

use Pike\{Db};
use Sivujetti\Block\BlockTree;
use Sivujetti\Layout\Entities\Layout;

final class LayoutsRepository {
    public const FIELDS = "l.`id` AS `layoutId`" .
                        ",l.`friendlyName` AS `layoutFriendlyName`" .
                        ",l.`relFilePath` AS `layoutRelFilePath`" .
                        ",l.`structure` AS `layoutStructureJson`";
    /** @var \Pike\Db  */
    private Db $db;
    /**
     * @param \Pike\Db $db
     */
    public function __construct(Db $db) {
        $this->db = $db;
    }
    /**
     * @param ?string $id = null
     * @return \Sivujetti\Layout\Entities\Layout[]
     */
    public function getMany(string $id = null): array {
        [$whereSql, $whereVals] = !$id ? ["", []] : [" WHERE l.`id` = ?", [$id]];
        $all = $this->db->fetchAll("SELECT " . self::FIELDS . " FROM `\${p}layouts` l{$whereSql}",
            $whereVals,
            \PDO::FETCH_CLASS,
            Layout::class);
        for ($i = 0; $i < count($all); ++$i) $all[$i] = Layout::fromParentRs($all[$i]);
        return $all;
    }
    /**
     * @param string $id
     * @return ?\Sivujetti\Layout\Entities\Layout
     */
    public function findById(string $id): ?Layout {
        return $this->getMany($id)[0] ?? null;
    }
    /**
     * @param string $id
     * @param object $data
     * @param array $columns = ["structure"]
     * @return int $numAffectedRows
     */
    public function updateById(string $id,
                               object $data,
                               array $columns = ["structure"]): int {
        if (count($columns) !== 1 || $columns[0] !== "structure")
            throw new \RuntimeException("Not implemented yet.");
        $updateData = ["structure" => BlockTree::toJson(
            array_map(fn($obj) => (object) array_merge(
                ["type" => $obj->type],
                $obj->type === "globalBlockTree"
                    ? ["globalBlockTreeId" => $obj->globalBlockTreeId]
                    : []
            ), $data->structure)
        )];
        [$columns, $values] = $this->db->makeUpdateQParts($updateData);
        return $this->db->exec("UPDATE `\${p}layouts` SET {$columns} WHERE `id` = ?",
                               array_merge($values, [$id]));
    }
}
