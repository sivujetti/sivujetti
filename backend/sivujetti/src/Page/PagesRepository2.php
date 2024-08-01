<?php declare(strict_types=1);

namespace Sivujetti\Page;

use Envms\FluentPDO\Queries\Select;
use Pike\{ArrayUtils, PikeException};
use Pike\Db\{FluentDb, FluentDb2, Query};
use Pike\Interfaces\RowMapperInterface;
use Sivujetti\Block\Entities\Block;
use Sivujetti\Db\TempJsonCompatSelect;
use Sivujetti\JsonUtils;
use Sivujetti\Page\Entities\Page;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\TheWebsite\Entities\TheWebsite;

final class PagesRepository2 {
    public const HARD_LIMIT = 200;
    /** @var \Pike\Db\FluentDb2 */
    private FluentDb2 $fluentDb2;
    /** @var \ArrayObject<int, \Sivujetti\PageType\Entities\PageType> */
    private \ArrayObject $pageTypes;
    /**
     * @param \Pike\Db\FluentDb2 $fluentDb2
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     */
    public function __construct(FluentDb2 $fluentDb2, TheWebsite $theWebsite) {
        $this->fluentDb2 = $fluentDb2;
        $this->pageTypes = $theWebsite->pageTypes;
    }
    /**
     * @param string $pageTypeName = "Pages"
     * @param string[] $fields = [] array<int, "@simple"|"@blocks">
     * @return \Pike\Db\MySelect|\Pike\Db\Query
     */
    public function select(string $pageTypeName = "Pages", array $fields = []): Select|Query {
        $pageType = $this->getPageTypeOrThrow($pageTypeName);
        if (!defined("USE_NEW_FLUENT_DB")) {
        $sqliteVersion = "3.37";
        $compatCls = version_compare($sqliteVersion, "3.38", ">=") ? null : TempJsonCompatSelect::class;
        return (new FluentDb($this->fluentDb2->getDb()))->select("\${p}{$pageType->name} p", Page::class, $compatCls)
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
        } else {
        return $this->fluentDb2->select("\${p}{$pageType->name} p")
            ->fields(self::createSelectFields($fields, $pageType))
            ->fetchWith(\PDO::FETCH_CLASS, Page::class)
            ->mapWith(function (Page $row, int $_rowNum, array $_rows): ?Page {
                // $row->slug set by pdo
                // $row->path set by pdo
                // $row->level set by pdo
                // $row->title set by pdo
                $row->meta = $row->metaJson ? JsonUtils::parse($row->metaJson) : null;
                unset($row->metaJson);
                // $row->layoutId set by pdo
                // $row->id set by pdo
                // $row->type set by pdo
                $row->blocks = array_map(fn($blockRaw) =>
                    Block::fromObject($blockRaw)
                , $row->blocksJson ? JsonUtils::parse($row->blocksJson) : []);
                unset($row->blocksJson);
                // $row->status set by pdo
                // $row->createdAt leave unset
                // $row->lastUpdatedAt leave unset
                // $row->layout leave unset
                // /* Own props set by pdo */
                return $row;
            });
        }
    }
    /**
     * @param string $pageTypeName = "Pages"
     * @return \Pike\Db\Query
     */
    public function insert(PageType $pageType): Query {
        return $this->fluentDb2->insert("\${p}{$pageType->name}");
    }
    /**
     * @param string $pageTypeName = "Pages"
     * @return \Pike\Db\Query
     */
    public function update(string $pageTypeName = "Pages"): Query {
        $pageType = $this->getPageTypeOrThrow($pageTypeName);
        return $this->fluentDb2->update("\${p}{$pageType->name}");
    }
    /**
     * @param string $pageTypeName = "Pages"
     * @return \Pike\Db\Query
     */
    public function delete(string $pageTypeName = "Pages"): Query {
        $pageType = $this->getPageTypeOrThrow($pageTypeName);
        return $this->fluentDb2->delete("\${p}{$pageType->name}");
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
            "'{$pageType->name}' AS `type`",
            "status",
            (in_array("@blocks", $fields, true) ? "blocks" : "NULL") . " AS blocksJson",
        ];
        if (in_array("@own", $fields, true))
            foreach ($pageType->ownFields as $f) $out[] = "`$f->name`";
        return $out;
    }
}
