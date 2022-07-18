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
     * @param string $themeId
     * @return \Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree|null
     */
    public function getSingle(string $globalBlockTreeId,
                              ?string $themeId = null): ?GlobalBlockTree {
        $q = $this->db->select("\${p}globalBlockTrees gbt", GlobalBlockTree::class);
        $fields = ["gbt.`id`", "gbt.`name`", "gbt.`blocks` AS `blocksJson`"];
        //
        return ($themeId
            ? $q
                ->leftJoin("\${p}globalBlocksStyles gbs ON (gbs.`globalBlockTreeId` = gbt.`id` AND gbs.`themeId` = ?)")
                ->fields([...$fields, "gbs.`styles` AS `blockStylesJson`"])
                ->where("gbt.`id` = ?", [$themeId, $globalBlockTreeId])
            : $q
                ->fields([...$fields, "NULL AS `blockStylesJson`"])
                ->where("gbt.`id` = ?", [$globalBlockTreeId])
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
     * @param \Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree $row
     */
    public static function normalizeSingle(object $row): void {
        $row->blocks = $row->blocksJson ? PagesRepository::blocksFromRs("blocksJson", $row) : null;
        $row->blockStyles = $row->blockStylesJson ? json_decode($row->blockStylesJson) : [];
    }
}
