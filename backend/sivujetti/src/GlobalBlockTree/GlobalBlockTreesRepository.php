<?php declare(strict_types=1);

namespace Sivujetti\GlobalBlockTree;

use Pike\Db\FluentDb;
use Pike\Interfaces\RowMapperInterface;
use Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree;
use Sivujetti\Page\PagesRepository;

final class GlobalBlockTreesRepository {
    /** @var \Pike\Db\FluentDb */
    private FluentDb $db;
    /**
     * @param \Pike\Db\FluentDb $db
     */
    public function __construct(FluentDb $db) {
        $this->db = $db;
    }
    /**
     * @param string $globalBlockTreeId
     * @return \Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree|null
     */
    public function getSingle(string $globalBlockTreeId): ?GlobalBlockTree {
        return $this->db->select("\${p}globalBlockTrees gbt", GlobalBlockTree::class)
            ->fields(["gbt.`id`", "gbt.`name`", "gbt.`blocks` AS `blocksJson`"])
            ->where("gbt.`id` = ?", [$globalBlockTreeId])
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
     * @param \Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree $row
     */
    public static function normalizeSingle(object $row): void {
        $row->blocks = $row->blocksJson ? PagesRepository::blocksFromRs("blocksJson", $row) : null;
    }
}
