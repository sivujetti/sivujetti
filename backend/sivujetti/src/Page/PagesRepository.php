<?php declare(strict_types=1);

namespace Sivujetti\Page;

use Pike\{ArrayUtils, Db, PikeException};
use Sivujetti\Block\Entities\Block;
use Sivujetti\JsonUtils;
use Sivujetti\Layout\Entities\Layout;
use Sivujetti\Layout\LayoutsRepository;
use Sivujetti\Page\Entities\Page;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\PageType\PageTypeValidator;
use Sivujetti\TheWebsite\Entities\TheWebsite;

/**
 * @psalm-type SelectFilter = array{0: string, 1: string}
 * @psalm-type SelectFilters = array{filters: array<int, SelectFilter>, order?: string, limit?: string}
 * @psalm-import-type RawPageTypeField from \Sivujetti\PageType\Entities\Field
 */
final class PagesRepository {
    /** @var string[] Fields that all page types share */
    private const DEFAULT_FIELDS = ["id", "slug", "path", "level", "title",
                                    "meta", "layoutId", "status", "createdAt",
                                    "lastUpdatedAt"];
    /** @var \Pike\Db */
    private Db $db;
    /** @var \ArrayObject<int, \Sivujetti\PageType\Entities\PageType> */
    private \ArrayObject $pageTypes;
    /** @var ?\Sivujetti\PageType\Entities\PageType */
    private ?PageType $pageType;
    /** @var \Sivujetti\PageType\PageTypeValidator */
    private PageTypeValidator $pageTypeValidator;
    /** @var string */
    public string $lastInsertId;
    /**
     * @param \Pike\Db $db
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     * @param \Sivujetti\PageType\PageTypeValidator $pageTypeValidator
     */
    public function __construct(Db $db,
                                TheWebsite $theWebsite,
                                PageTypeValidator $pageTypeValidator) {
        $this->db = $db;
        $this->pageTypes = $theWebsite->pageTypes;
        $this->pageType = null;
        $this->pageTypeValidator = $pageTypeValidator;
        $this->lastInsertId = "0";
    }
    /**
     * @param \Sivujetti\PageType\Entities\PageType|string $pageTypeOrPageTypeName
     * @psalm-param SelectFilters $filters
     * @return \Sivujetti\Page\Entities\Page|null
     */
    public function getSingle(string|PageType $pageTypeOrPageTypeName,
                              array $filters): ?Page {
        $rows = $this->doGetMany($pageTypeOrPageTypeName, true, $filters);
        return $rows[0] ?? null;
    }
    /**
     * @param \Sivujetti\PageType\Entities\PageType|string $pageTypeOrPageTypeName
     * @psalm-param SelectFilters $filters
     * @return \Sivujetti\Page\Entities\Page[]
     */
    public function getMany(string|PageType $pageTypeOrPageTypeName,
                            array $filters): array {
        return $this->doGetMany($pageTypeOrPageTypeName, false, $filters);
    }
    /**
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     * @param object $inputData
     * @param string $validBlocksJson
     * @param bool $doInsertRevision = false
     * @param bool $doInsertAsDraft = false
     * @return array{0: int, 1: null|array} [$numAffectedRows, $errors]
     */
    public function insert(PageType $pageType,
                           object $inputData,
                           string $validBlocksJson,
                           bool $doInsertRevision = false,
                           bool $doInsertAsDraft = false): array {
        $this->lastInsertId = "0";
        if (($errors = $this->pageTypeValidator->validateInsertData($pageType, $inputData, false)))
            return [0, $errors];
        if ($this->getSingle($pageType, ["filters" => [ ["slug", $inputData->slug] ]]))
            return [0, ["Page with identical slug already exists"]];
        $data = self::makeStorablePageDataFromValidInput($inputData, $pageType);
        $data->id = $inputData->id;
        $data->blocks = $validBlocksJson;
        foreach (["status", "createdAt", "lastUpdatedAt"] as $optional) {
            if (($inputData->{$optional} ?? null) !== null)
                $data->{$optional} = (int) $inputData->{$optional};
        }
        //
        if (!is_int($data->createdAt ?? null)) $data->createdAt = time();
        $data->lastUpdatedAt = $data->createdAt;
        [$qList, $values, $columns] = $this->db->makeInsertQParts($data);
        // @allow \Pike\PikeException
        $this->db->beginTransaction();
        $numRows = $this->db->exec("INSERT INTO `\${p}{$pageType->name}` ({$columns})" .
                                   " VALUES ({$qList})", $values);
        if (!$numRows || !($this->lastInsertId = strval($data->id ?? $this->db->lastInsertId()))) {
            $this->db->rollBack();
            return [0, ["Ineffectual db op"]];
        }
        if ($doInsertRevision)
            $numRows += $this->insertRevision(self::makeSnapshot($data, $pageType->ownFields), $doInsertAsDraft);
        $this->db->commit();
        return [$numRows, []];
    }
    /**
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     * @param string $id
     * @param object|\Sivujetti\Page\Entities\Page $input
     * @param bool $doInsertRevision = false
     * @return int $numAffectedRows
     */
    public function updateById(PageType $pageType,
                               string $id,
                               object $input,
                               bool $doInsertRevision = false): int {
        if (($errors = $this->pageTypeValidator->validateUpdateData($pageType, $input)))
            throw new PikeException(implode(PHP_EOL, $errors), PikeException::BAD_INPUT);
        $updateData = self::makeStorablePageDataFromValidInput($input, $pageType);
        $theseColumnsOnly = self::DEFAULT_FIELDS;
        foreach ($pageType->ownFields as $field)
            $theseColumnsOnly[] = $field->name;
        //
        $updateData->lastUpdatedAt = time();
        [$columns, $values] = $this->db->makeUpdateQParts($updateData, $theseColumnsOnly);
        if ($doInsertRevision)
            throw new \RuntimeException("Not implemented yet.");
        return $this->db->exec("UPDATE `\${p}{$pageType->name}` SET {$columns} WHERE `id` = ?",
                               array_merge($values, [$id]));
    }
    /**
     * @param \Sivujetti\PageType\Entities\PageType|string $pageTypeOrPageTypeName
     * @param bool $doIncludeLayouts
     * @psalm-param SelectFilters $filters
     * @return \Sivujetti\Page\Entities\Page[]
     */
    private function doGetMany(string|PageType $pageTypeOrPageTypeName,
                               bool $doIncludeLayouts,
                               array $filters): array {
        $pageType = $this->getPageTypeOrThrow($pageTypeOrPageTypeName);
        $this->pageType = $pageType;
        [$filterCols, $filterVals, $joinsCols, $joins] = $this->filtersToQParts($pageType, $filters["filters"]);
        //
        $baseJoinCols = "";
        $baseJoin = "";
        //
        if (!$doIncludeLayouts) {
            $baseJoinCols .= ",'' AS `layoutId`" .
                ",'' AS `layoutFriendlyName`" .
                ",'' AS `layoutRelFilePath`" .
                ",'' AS `layoutStructureJson`";
        } else {
            $baseJoinCols .= "," . LayoutsRepository::FIELDS;
            $baseJoin .= " LEFT JOIN `\${p}layouts` l ON (l.`id` = p.`layoutId`)";
        }
        //
        $ownFieldCols = [];
        foreach ($pageType->ownFields as $f)
            $ownFieldCols[] = "p.`$f->name` AS `$f->name`";
        //
        $order = $filters["order"] ?? null;
        $limit = $filters["limit"] ?? 40; // null -> 40
        $limit = min($limit > 0 ? $limit : 40, 100); // 0 -> 40, 1 -> 1, 120 -> 100
        $rows = $this->db->fetchAll(
            "SELECT p.`id`,p.`slug`,p.`path`,p.`level`,p.`title`,p.`meta` AS `metaJson`,p.`layoutId`," .
                "p.`blocks` AS `pageBlocksJson`,'{$pageType->name}' AS `type`,p.`status`," .
                "p.`createdAt`,p.`lastUpdatedAt`" .
                $baseJoinCols .
                ($ownFieldCols ? ("," . implode(',', $ownFieldCols)) : "") .
                $joinsCols .
            " FROM `\${p}{$pageType->name}` p" .
            $baseJoin .
            $joins .
            ($filterCols ? " WHERE {$filterCols}" : "") .
            ($order ? (" ORDER BY " . match($order) {
                "desc" => " p.`id` DESC",
                "asc" => " p.`id` ASC",
                "rand" => $this->db->attr(\PDO::ATTR_DRIVER_NAME) === "sqlite" ? "RANDOM()" : "RAND()",
                default => throw new PikeException("Sanity", PikeException::BAD_INPUT),
            }) : "") .
            (" LIMIT " . ((int) $limit)),
            $filterVals,
            \PDO::FETCH_CLASS,
            Page::class
        );
        return $this->normalizeRs($rows);
    }
    /**
     * @param \Sivujetti\Page\Entities\Page[] $rows
     * @return \Sivujetti\Page\Entities\Page[]
     */
    private function normalizeRs(array $rows): array {
        $doIncludeLayouts = ($rows[0]?->layoutId ?? null) !== null;
        foreach ($rows as $row) {
            $row->meta = $row->metaJson
                ? JsonUtils::parse($row->metaJson)
                : null;
            $row->blocks = self::blocksFromRs("pageBlocksJson", $row);
            $row->layout = $doIncludeLayouts
                ? Layout::fromParentRs($row)
                : new Layout;
            //
            foreach ($this->pageType->ownFields as $field)
                $row->{$field->name} = $field->dataType->type !== "many-to-many"
                    ? strval($row->{$field->name})
                    : JsonUtils::parse($row->{$field->name});
        }
        return $rows;
    }
    /**
     * @param string|\Sivujetti\PageType\Entities\PageType $candidate
     * @return \Sivujetti\PageType\Entities\PageType
     * @throws \Pike\PikeException
     */
    public function getPageTypeOrThrow(string|PageType $candidate): PageType {
        if ($candidate instanceof PageType) return $candidate;
        if (($possible = ArrayUtils::findByKey($this->pageTypes, $candidate, "name")))
            return $possible;
        throw new PikeException("Unknown page type `{$candidate}`.");
    }
    /**
     * @return string
     */
    public function getLastInsertId(): string {
        return $this->lastInsertId;
    }
    /**
     * @param string $snapshot
     * @param bool $doInsertRevisionAsCurrentDraft
     * @return int ok = 1, fail = 0
     */
    private function insertRevision(string $snapshot,
                                    bool $doInsertRevisionAsCurrentDraft): int {
        return 1;
    }
    /**
     * @param string $key
     * @param object $row
     * @return \Sivujetti\Block\Entities\Block[]
     */
    private static function blocksFromRs(string $key, object $row): array {
        $arr = [];
        foreach (JsonUtils::parse($row->{$key}) as $data)
            $arr[] = Block::fromObject($data);
        unset($row->{$key});
        return $arr;
    }
    /**
     * @param object $input Valid $req->body
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     * @return object An object that can be passed to $db->makeUpdateQParts()
     */
    private static function makeStorablePageDataFromValidInput(object $input,
                                                               PageType $pageType): object {
        $meta = (object) [];
        if (($descr = $input->meta->description ?? null))
            $meta->description = $descr;
        $img = $input->meta->socialImage ?? null;
        $meta->socialImage = gettype($img) === "object"
            ? (object) ["src" => $img->src, "mime" => $img->mime,
                        "height" => $img->height, "width" => $img->width]
            : null;
        //
        $out = (object) [
            "slug" => $input->slug,
            "path" => $input->path,
            "level" => (int) $input->level,
            "title" => $input->title,
            "meta" => JsonUtils::stringify($meta),
            "layoutId" => $input->layoutId,
            "status" => (int) $input->status,
        ];
        foreach ($pageType->ownFields as $field)
            $out->{$field->name} = $field->dataType->type !== "many-to-many"
                ? $input->{$field->name} ?? null
                : JsonUtils::stringify($input->{$field->name});
        return $out;
    }
    /**
     * @param \stdClass $data
     * @psalm-param array<int, RawPageTypeField> $fields
     * @return string
     */
    private static function makeSnapshot(\stdClass $data, array $fields): string {
        $out = new \stdClass;
        foreach ($fields as $f)
            $out->{$f->name} = $data->{$f->name};
        return JsonUtils::stringify($out);
    }
    /**
     * todo
     */
    private function filtersToQParts(PageType $pageType, array $filters): array {
        $filterSql = [];
        $filterValues = [];
        $escape = function (string $candidate): string {
            return $candidate !== "p.`id`" ? $this->db->columnify($candidate) : $candidate;
        };
        foreach ($filters as $filter) {
            [$col, $val] = $filter;
            $filterSql[] = "{$escape($col)} = ?";
            $filterValues[] = $val;
        }
        return [implode(" AND ", $filterSql), $filterValues, "", ""];
    }
}
