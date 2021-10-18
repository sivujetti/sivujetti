<?php declare(strict_types=1);

namespace Sivujetti\Layout;

use Pike\{Db};
use Sivujetti\Block\BlockTree;

final class LayoutsRepository {
    /** @var  */
    private Db $db;
    /**
     * @param 
     */
    public function __construct(Db $db) {
        $this->db = $db;
    }
    /**
     */
    public function getMany(string $id = null): array {
        [$a, $b] = !$id ? ["", []] : [" WHERE `id` = ?", [$id]];
        $all = $this->db->fetchAll("SELECT `id`,`name`,'layout.default.tmpl.php' AS `filePath`,`structure` AS `structureJson` FROM `\${p}layouts`{$a}",$b,\PDO::FETCH_CLASS,'stdClass');
        foreach ($all as $layout) $layout->structure = json_decode($layout->structureJson, flags: JSON_THROW_ON_ERROR);
        return $all;
    }
    /**
     */
    public function findById(string $id): ?\stdClass {
        return $this->getMany($id)[0] ?? null;
    }
    /**
     * @param string $id
     * @param object $data
     * @param string $columns = "structure"
     * @return int $numAffectedRows
     */
    public function updateById(string $id,
                               object $data,
                               string $columns = "stucture"): int {
        if ($columns !== "structure")
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
