<?php declare(strict_types=1);

namespace Sivujetti\Page;

use Envms\FluentPDO\Queries\Select;
use Pike\{ArrayUtils, PikeException};
use Pike\Db\{FluentDb, MyInsert, MyUpdate};
use Pike\Interfaces\RowMapperInterface;
use Sivujetti\Block\Entities\Block;
use Sivujetti\Db\TempJsonCompatSelect;
use Sivujetti\JsonUtils;
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
     * @param string[] $fields = [] array<int, "@simple"|"@blocks">
     * @return \Pike\Db\MySelect
     */
    public function select(string $pageTypeName = "Pages", array $fields = []): Select {
        $pageType = $this->getPageTypeOrThrow($pageTypeName);
        $sqliteVersion = "3.37";
        $compatCls = version_compare($sqliteVersion, "3.38", ">=") ? null : TempJsonCompatSelect::class;
        return $this->fluentDb->select("\${p}{$pageType->name} p", Page::class, $compatCls)
            ->fields(self::createSelectFields($fields, $pageType))
            ->mapWith(new class implements RowMapperInterface {
                public function mapRow(object $page, int $_numRow, array $_rows): object {
                    $page->meta = $page->metaJson ? JsonUtils::parse($page->metaJson) : null;
                    unset($page->metaJson);
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
     * @param string $pageTypeName = "Pages"
     * @return \Pike\Db\MyInsert
     */
    public function insert(PageType $pageType): MyInsert {
        return $this->fluentDb->insert("\${p}{$pageType->name}");
    }
    /**
     * @param string $pageTypeName = "Pages"
     * @return \Pike\Db\MyUpdate
     */
    public function update(string $pageTypeName = "Pages"): MyUpdate {
        $pageType = $this->getPageTypeOrThrow($pageTypeName);
        return $this->fluentDb->update("\${p}{$pageType->name}");
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
    /**
     * @param string[] $fields ["@simple"]
     * @param \Sivujetti\PageType\Entities\PageType
     * @return string[]
     */
    private static function createSelectFields(array $fields, PageType $pageType): array {
        $out = [
            "id",
            "slug",
            "path",
            "level",
            "title",
            "meta as metaJson",
            "layoutId",
            "'{$pageType->name}' AS `type`", "status",
            (in_array("@blocks", $fields, true) ? "blocks" : "NULL") . " AS blocksJson",
        ];
        if (in_array("@own", $fields, true))
            foreach ($pageType->ownFields as $f) $out[] = "`$f->name`";
        return $out;
    }
}
