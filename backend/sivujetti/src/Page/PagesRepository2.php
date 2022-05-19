<?php declare(strict_types=1);

namespace Sivujetti\Page;

use Envms\FluentPDO\Queries\Select;
use Pike\{ArrayUtils, PikeException};
use Pike\Db\FluentDb;
use Pike\Interfaces\RowMapperInterface;
use Sivujetti\Block\Entities\Block;
use Sivujetti\Page\Entities\Page;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\TheWebsite\Entities\TheWebsite;

final class PagesRepository2 {
    public const HARD_LIMIT = 200;
    /** @var \Pike\Db\FluentDb */
    private FluentDb $fluentDb;
    /** @var \ArrayObject<int, \Sivujetti\PageType\Entities\PageType> */
    private \ArrayObject $pageTypes;
    /**
     * @param \Pike\Db\FluentDb $fluentDb
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     */
    public function __construct(FluentDb $fluentDb, TheWebsite $theWebsite) {
        $this->fluentDb = $fluentDb;
        $this->pageTypes = $theWebsite->pageTypes;
    }
    /**
     * @param string $pageTypeName = "Pages"
     * @param string $fields = "@all" "@all"|"@simple"
     * @return \Pike\Db\MySelect
     */
    public function fetch(string $pageTypeName = "Pages", string $fields = "@all"): Select {
        $pageType = $this->getPageTypeOrThrow($pageTypeName);
        return $this->fluentDb->select("\${p}{$pageType->name} p", Page::class)
            ->fields(["id","slug","path","level","title","layoutId","status",(($fields === "@simple" ? "NULL" : "blocks") . " AS blocksJson")])
            ->mapWith(new class implements RowMapperInterface {
                public function mapRow(object $page, int $_numRow, array $_rows): object {
                    $blocksJson = $page->blocksJson ?? null;
                    $page->blocks = $blocksJson ? array_map(fn($blockRaw) =>
                        Block::fromObject($blockRaw)
                    , json_decode($blocksJson, flags: JSON_THROW_ON_ERROR)) : [];
                    unset($page->blocksJson);
                    return $page;
                }
            });
    }
    /**
     * @param string $candidate
     * @return \Sivujetti\PageType\Entities\PageType
     * @throws \Pike\PikeException
     */
    protected function getPageTypeOrThrow(string $candidate): PageType {
        if (($possible = ArrayUtils::findByKey($this->pageTypes, $candidate, "name")))
            return $possible;
        throw new PikeException("Unknown page type `{$candidate}`.");
    }
}
