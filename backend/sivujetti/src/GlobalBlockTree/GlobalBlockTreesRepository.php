<?php declare(strict_types=1);

namespace Sivujetti\GlobalBlockTree;

use Pike\Db\FluentDb2;
use Sivujetti\Block\Entities\Block;
use Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree;
use Sivujetti\JsonUtils;

final class GlobalBlockTreesRepository {
    /** @var \Pike\Db\FluentDb2 */
    private FluentDb2 $db2;
    /**
     * @param \Pike\Db\FluentDb2 $db2
     */
    public function __construct(FluentDb2 $db2) {
        $this->db2 = $db2;
    }
    /**
     * @param string $globalBlockTreeId
     * @return \Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree|null
     */
    public function getSingle(string $globalBlockTreeId): ?GlobalBlockTree {
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
