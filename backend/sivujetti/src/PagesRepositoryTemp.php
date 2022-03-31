<?php declare(strict_types=1);

namespace Sivujetti;

use Envms\FluentPDO\Queries\Select;
use Pike\Db\FluentDb;
use Pike\Interfaces\RowMapperInterface;
use Sivujetti\Block\Entities\Block;
use Sivujetti\Page\Entities\Page;

final class PagesRepositoryTemp {
    private FluentDb $fluentDb;
    public function __construct(FluentDb $fluentDb) {
        $this->fluentDb = $fluentDb;
    }
    public function fetch(): Select {
        return $this->fluentDb->select("\${p}Pages", Page::class)
            ->fields(["id","slug","path","level","title","layoutId","blocks AS blocksJson","status"])
            ->mapWith(new class implements RowMapperInterface {
                public function mapRow(object $page, int $_numRow, array $_rows): object {
                    $page->blocks = array_map(fn($blockRaw) =>
                        Block::fromObject($blockRaw)
                    , json_decode($page->blocksJson, flags: JSON_THROW_ON_ERROR));
                    return $page;
                }
            });
    }
}
