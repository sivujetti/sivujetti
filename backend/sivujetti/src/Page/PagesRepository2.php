<?php declare(strict_types=1);

namespace Sivujetti\Page;

use Envms\FluentPDO\Queries\Select;
use Pike\{ArrayUtils, PikeException};
use Pike\Db\FluentDb;
use Pike\Interfaces\RowMapperInterface;
use Sivujetti\Block\Entities\Block;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\TheWebsite\Entities\TheWebsite;

final class PagesRepository2 {
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
     * @return \Pike\Db\MySelect
     */
    public function fetch(string $pageTypeName = "Pages"): Select {
        $pageType = $this->getPageTypeOrThrow($pageTypeName);
        return $this->fluentDb->select("\${p}{$pageType->name} p", Page::class)
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
