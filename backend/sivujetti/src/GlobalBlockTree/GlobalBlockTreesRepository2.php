<?php declare(strict_types=1);

namespace Sivujetti\GlobalBlockTree;

use Envms\FluentPDO\Queries\Select;
use Pike\Db\{FluentDb, MyInsert, MyUpdate};
use Pike\Interfaces\RowMapperInterface;
use Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree;
use Sivujetti\Page\PagesRepository;

final class GlobalBlockTreesRepository2 {
    private const T = "\${p}globalBlockTrees";
    /** @var \Pike\Db\FluentDb */
    private FluentDb $fluentDb;
    /**
     * @param \Pike\Db\FluentDb $fluentDb
     */
    public function __construct(FluentDb $fluentDb) {
        $this->fluentDb = $fluentDb;
    }
    /**
     * @return \Pike\Dd\MyInsert
     */
    public function insert(): MyInsert {
        return $this->fluentDb->insert(self::T);
    }
    /**
     * @return \Pike\Db\MySelect
     */
    public function select(): Select {
        return $this->fluentDb->select(self::T, GlobalBlockTree::class)
            ->fields(["id", "name", "blocks AS blocksJson"])
            ->mapWith(new class implements RowMapperInterface {
                public function mapRow(object $row, int $_numRow, array $_rows): object {
                    GlobalBlockTreesRepository2::normalizeSingle($row);
                    return $row;
                }
            })
            ->limit(20);
    }
    /**
     * @return \Pike\Dd\MyUpdate
     */
    public function update(): MyUpdate {
        return $this->fluentDb->update(self::T);
    }
    /**
     * @param \Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree $row
     */
    public static function normalizeSingle(object $row): void {
        $row->blocks = $row->blocksJson ? PagesRepository::blocksFromRs("blocksJson", $row) : null;
        unset($row->blocksJson);
    }
}
