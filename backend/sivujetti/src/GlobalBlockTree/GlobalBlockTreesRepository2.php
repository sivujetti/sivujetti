<?php declare(strict_types=1);

namespace Sivujetti\GlobalBlockTree;

use Pike\Db\{FluentDb2, Query};
use Sivujetti\Block\Entities\Block;
use Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree;
use Sivujetti\JsonUtils;

final class GlobalBlockTreesRepository2 {
    private const T = "\${p}globalBlockTrees";
    /** @var \Pike\Db\FluentDb2 */
    private FluentDb2 $db2;
    /**
     * @param \Pike\Db\FluentDb2 $db2
     */
    public function __construct(FluentDb2 $db2) {
        $this->db2 = $db2;
    }
    /**
     * @return \Pike\Db\Query
     */
    public function insert(): Query {
        return $this->db2->insert(self::T);
    }
    /**
     * @return \Pike\Db\Query
     */
    public function select(): Query {
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
            ->limit(80);
    }
    /**
     * @return \Pike\Db\Query
     */
    public function update(): Query {
        return $this->db2->update(self::T);
    }
}
