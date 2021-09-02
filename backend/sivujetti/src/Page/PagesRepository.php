<?php declare(strict_types=1);

namespace Sivujetti\Page;

use Pike\{ArrayUtils, Db, PikeException};
use Sivujetti\Block\{BlocksController, BlockTree};
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\Entities\BlockTypes;
use Sivujetti\Page\Entities\Page;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\PageType\PageTypeValidator;
use Sivujetti\TheWebsite\Entities\TheWebsite;

final class PagesRepository {
    /** @var \Pike\Db */
    private Db $db;
    /** @var \Sivujetti\PageType\Entities\PageType[] */
    private \ArrayObject $pageTypes;
    /** @var object */
    private object $blockTypes;
    /** @var ?\Sivujetti\PageType\Entities\PageType */
    private ?PageType $pageType;
    /** @var string */
    public string $lastInsertId;
    /**
     * @param \Pike\Db $db
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     * @param \Sivujetti\BlockType\Entities\BlockTypes $blockTypes
     * @param \Sivujetti\PageType\PageTypeValidator $pageTypeValidator
     */
    public function __construct(Db $db,
                                TheWebsite $theWebsite,
                                BlockTypes $blockTypes,
                                PageTypeValidator $pageTypeValidator) {
        $this->db = $db;
        $this->pageTypes = $theWebsite->pageTypes;
        $this->blockTypes = $blockTypes;
        $this->pageType = null;
        $this->pageTypeValidator = $pageTypeValidator;
        $this->lastInsertId = "0";
    }
    /**
     * @param \Sivujetti\PageType\Entities\PageType|string $pageTypeOrPageTypeName
     * @param string|string[] ...$filters
     * @return \Sivujetti\Page\Entities\Page|null
     */
    public function getSingle(string|PageType $pageTypeOrPageTypeName, ...$filters): ?Page {
        $rows = $this->doGetMany($pageTypeOrPageTypeName, true, ...$filters);
        return $rows[0] ?? null;
    }
    /**
     * @param \Sivujetti\PageType\Entities\PageType|string $pageTypeOrPageTypeName
     * @param string|string[] ...$filters
     * @return \Sivujetti\Page\Entities\Page[]
     */
    public function getMany(string|PageType $pageTypeOrPageTypeName, ...$filters): array {
        return $this->doGetMany($pageTypeOrPageTypeName, false, ...$filters);
    }
    /**
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     * @param object $inputData
     * @param bool $doInsertRevision = false
     * @param bool $doInsertAsDraft = false
     * @return int $numAffectedRows
     * @throws \Pike\PikeException If $inputData is not valid
     */
    public function insert(PageType $pageType,
                           object $inputData,
                           bool $doInsertRevision = false,
                           bool $doInsertAsDraft = false,
                           bool $doValidateBlocks = true): int {
        $this->lastInsertId = "0";
        if (($errors = $this->pageTypeValidator->validateInsertData($pageType, $inputData,
            $doValidateBlocks ? $this->blockTypes : null)))
            throw new PikeException(implode(PHP_EOL, $errors),
                                    PikeException::BAD_INPUT);
        $data = new \stdClass;
        foreach ([["slug","string"],
                  ["path","string"],
                  ["level","int"],
                  ["title","string"],
                  ["layoutId","int"]] as [$defaultFieldName, $valueType]) {
            $data->{$defaultFieldName} = $valueType === "string"
                ? $inputData->{$defaultFieldName}
                : (int) $inputData->{$defaultFieldName};
        }
        $data->blocks = BlockTree::toJson(BlocksController::makeStorableBlocksDataFromValidInput(
            $inputData->blocks, $this->blockTypes));
        foreach (["id", "status"] as $optional) {
            if (($inputData->{$optional} ?? null) !== null)
                $data->{$optional} = (int) $inputData->{$optional};
        }
        foreach ($pageType->ownFields as $f) {
            $data->{$f->name} = $inputData->{$f->name};
        }
        //
        [$qList, $values, $columns] = $this->db->makeInsertQParts($data);
        // @allow \Pike\PikeException
        $this->db->beginTransaction();
        $numRows = $this->db->exec("INSERT INTO `\${p}{$pageType->name}` ({$columns})" .
                                   " VALUES ({$qList})", $values);
        if (!$numRows || !($this->lastInsertId = $this->db->lastInsertId()))
            return 0;
        if ($doInsertRevision)
            $numRows += $this->insertRevision(self::makeSnapshot($data, $pageType->ownFields), $doInsertAsDraft);
        $this->db->commit();
        return $numRows;
    }
    /**
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     * @param string $id
     * @param object|\Sivujetti\Page\Entities\Page $newData
     * @param bool $doInsertRevision = false
     * @param array $theseColumnsOnly = []
     * @return int $numAffectedRows
     */
    public function updateById(PageType $pageType,
                               string $id,
                               object $newData,
                               bool $doInsertRevision = false,
                               array $theseColumnsOnly = []): int {
        if (!$theseColumnsOnly) {
            $updateData = (object) [
                "slug" => $newData->slug,
                "path" => $newData->path,
                "level" => $newData->level,
                "title" => $newData->title,
                "layoutId" => $newData->layoutId,
                "blocks" => BlockTree::toJson($newData->blocks),
                "status" => $newData->status,
            ];
            if (($errors = $this->pageTypeValidator->validateUpdateData($pageType, $updateData)))
                throw new PikeException(implode(PHP_EOL, $errors),
                                        PikeException::BAD_INPUT);
        } elseif (count($theseColumnsOnly) === 1 && $theseColumnsOnly[0] === "blocks") {
            if (($errors = $this->pageTypeValidator->validateUpdateData($pageType, $newData, $this->blockTypes)))
                throw new PikeException(implode(PHP_EOL, $errors),
                                        PikeException::BAD_INPUT);
            $updateData = (object) ["blocks" =>
                BlockTree::toJson(BlocksController::makeStorableBlocksDataFromValidInput(
                                  $newData->blocks, $this->blockTypes))
            ];
        } else {
            throw new \InvalidArgumentException("\$theseColumnsOnly supports only ['blocks'] and []");
        }
        //
        [$columns, $values] = $this->db->makeUpdateQParts($updateData, $theseColumnsOnly);
        if ($doInsertRevision)
            throw new \RuntimeException("Not implemented yet.");
        return $this->db->exec("UPDATE `\${p}{$pageType->name}` SET {$columns} WHERE `id` = ?",
                               array_merge($values, [$id]));
    }
    /**
     * @param \Sivujetti\PageType\Entities\PageType|string $pageTypeOrPageTypeName
     * @param bool $doIncludeLayoutBlocks
     * @param string|string[] ...$filters
     * @return \Sivujetti\Page\Entities\Page[]
     */
    private function doGetMany(string|PageType $pageTypeOrPageTypeName,
                               bool $doIncludeLayoutBlocks,
                               ...$filters): array {
        $pageType = $this->getPageTypeOrThrow($pageTypeOrPageTypeName);
        $this->pageType = $pageType;
        [$filterCols, $filterVals, $joinsCols, $joins] = $this->filtersToQParts(...$filters);
        [$baseJoinCols, $baseJoin] = !$doIncludeLayoutBlocks
            ? [",'[]' AS `layoutBlocksJson`",
               ""]
            : [",IFNULL(lb.`blocks`, '[]') AS `layoutBlocksJson`",
               " LEFT JOIN `\${p}layoutBlocks` lb ON (lb.`layoutId` = p.`layoutId`)"];
        //
        $rows = $this->db->fetchAll(
            "SELECT p.`id`,p.`slug`,p.`path`,p.`level`,p.`title`,p.`layoutId`," .
                "p.`blocks` AS `pageBlocksJson`,'{$pageType->name}' AS `type`,p.`status`" .
                $baseJoinCols .
                ($pageType->ownFields ? ("," . implode(',', array_map(fn(object $f) =>
                    "p.`$f->name` AS `$f->name`"
                , $pageType->ownFields))) : "") .
                $joinsCols .
            " FROM `\${p}{$pageType->name}` p" .
            $baseJoin .
            $joins .
            ($filterCols ? " WHERE {$filterCols}" : "") .
            " LIMIT 40",
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
        foreach ($rows as $row) {
            $row->blocks = self::blocksFromRs("pageBlocksJson", $row);
            $row->layout = (object) ["blocks" => self::blocksFromRs("layoutBlocksJson", $row)];
            //
            foreach ($this->pageType->ownFields as $field)
                $row->{$field->name} = strval($row->{"{$field->name}"}); // todo cast type?
        }
        return $rows;
    }
    /**
     * @param string $key
     * @param object $row
     * @return \Sivujetti\Block\Entities\Block[]
     */
    public static function blocksFromRs(string $key, object $row): array {
        $arr = [];
        foreach (json_decode($row->{$key}, flags: JSON_THROW_ON_ERROR) as $data)
            $arr[] = Block::fromObject($data);
        unset($row->{$key});
        return $arr;
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
     * @param string $snapshot
     * @param bool $doInsertRevisionAsCurrentDraft
     * @return int ok = 1, fail = 0
     */
    private function insertRevision(string $snapshot,
                                    bool $doInsertRevisionAsCurrentDraft): int {
        return 1;
    }
    /**
     * @param \stdClass $data
     * @param array $fields
     * @return string
     */
    private static function makeSnapshot(\stdClass $data, array $fields): string {
        $out = new \stdClass;
        foreach ($fields as $f)
            $out->{$f->name} = $data->{$f->name};
        return json_encode($out, JSON_UNESCAPED_UNICODE);
    }
    /**
     * todo
     */
    private function filtersToQParts(...$filters): array {
        $filterSql = "";
        $filterValues = [];
        foreach ($filters as $inp) {
            // todo validate
            $column = key($inp);
            $cand = $inp[$column];
            $f = is_string($cand) ? ["", "", $column] : $inp;
            $filterSql .= ($f[0] ?? " AND ") . $this->db->columnify($f[2]) . ($f[1] ?: "=") . "?";
            $filterValues[] = $cand;
        }
        return [$filterSql, $filterValues, "", ""];
    }
}
