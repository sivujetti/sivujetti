<?php declare(strict_types=1);

namespace Sivujetti\GlobalBlockTree;

use Pike\Db\{FluentDb, FluentDb2};
use Pike\Interfaces\RowMapperInterface;
use Sivujetti\Block\Entities\Block;
use Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree;
use Sivujetti\JsonUtils;
use Sivujetti\Page\PagesRepository;

final class GlobalBlockTreesRepository {
    /** @var \Pike\Db\FluentDb */
    private FluentDb $db;
    /** @var \Pike\Db\FluentDb2 */
    private FluentDb2 $db2;
    /**
     * @param \Pike\Db\FluentDb $db
     * @param \Pike\Db\FluentDb2 $db2
     */
    public function __construct(FluentDb $db, FluentDb2 $db2) {
        $this->db = $db;
        $this->db2 = $db2;
    }
    /**
     * @param string $globalBlockTreeId
     * @return \Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree|null
     */
    public function getSingle(string $globalBlockTreeId): ?GlobalBlockTree {
        if (!defined("USE_NEW_FLUENT_DB")) {
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
        } else {
        return $this->db2->select("\${p}globalBlockTrees")
            ->where("id = ?", [$globalBlockTreeId])
            ->fetch(function (string $id, string $name, string $blocks) {
                $out = new GlobalBlockTree;
                $out->id = $id;
                $out->name = $name;
                $out->blocks = array_map(fn($blockRaw) =>
                    Block::fromObject($blockRaw)
                , JsonUtils::parse($blocks));
                return $out;
            });
        }
    }
    /**
     * @param \Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree $row
     */
    public static function normalizeSingle(object $row): void {
        $row->blocks = $row->blocksJson ? PagesRepository::blocksFromRs("blocksJson", $row) : null;
    }
}
