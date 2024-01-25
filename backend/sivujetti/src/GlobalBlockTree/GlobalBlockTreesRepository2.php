<?php declare(strict_types=1);

namespace Sivujetti\GlobalBlockTree;

use Envms\FluentPDO\Queries\Select;
use Pike\Db\{FluentDb, FluentDb2, Q, MyInsert, MyUpdate};
use Pike\Interfaces\RowMapperInterface;
use Sivujetti\Block\Entities\Block;
use Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree;
use Sivujetti\JsonUtils;
use Sivujetti\Page\PagesRepository;

final class GlobalBlockTreesRepository2 {
    private const T = "\${p}globalBlockTrees";
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
     * @return \Pike\Db\MyInsert|\Pike\Db\Q
     */
    public function insert(): MyInsert|Q {
        if (!defined("USE_NEW_FLUENT_DB"))
            return $this->db->insert(self::T);
        else
            return $this->db2->insert(self::T);
    }
    /**
     * @return \Pike\Db\MySelect|\Pike\Db\Q
     */
    public function select(): Select|Q {
        if (!defined("USE_NEW_FLUENT_DB")) {
        return $this->db->select(self::T, GlobalBlockTree::class)
            ->fields(["id", "name", "blocks AS blocksJson"])
            ->mapWith(new class implements RowMapperInterface {
                public function mapRow(object $row, int $_numRow, array $_rows): object {
                    GlobalBlockTreesRepository2::normalizeSingle($row);
                    return $row;
                }
            })
            ->limit(20);
        } else {
        return $this->db2->select(self::T)
            ->fetchWith(function (string $id, string $name, string $blocks) {
                $out = new GlobalBlockTree;
                $out->id = $id;
                $out->name = $name;
                $out->blocks = array_map(fn($blockRaw) =>
                    Block::fromObject($blockRaw)
                , JsonUtils::parse($blocks));
                return $out;
            })
            ->limit(20);
        }
    }
    /**
     * @return \Pike\Db\MyUpdate|\Pike\Db\Q
     */
    public function update(): MyUpdate|Q {
        if (!defined("USE_NEW_FLUENT_DB"))
            return $this->db->update(self::T);
        else
            return $this->db2->update(self::T);
    }
    /**
     * @param \Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree $row
     */
    public static function normalizeSingle(object $row): void {
        $row->blocks = $row->blocksJson ? PagesRepository::blocksFromRs("blocksJson", $row) : null;
        unset($row->blocksJson);
    }
}
