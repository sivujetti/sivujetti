<?php declare(strict_types=1);

namespace Sivujetti\Page;

use Pike\{ArrayUtils, Db, PikeException};
use Sivujetti\Block\{BlocksController, BlocksController2, BlockTree};
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\Entities\BlockTypes;
use Sivujetti\Layout\Entities\Layout;
use Sivujetti\Layout\LayoutsRepository;
use Sivujetti\Page\Entities\Page;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\PageType\PageTypeValidator;
use Sivujetti\TheWebsite\Entities\TheWebsite;

final class PagesRepository {
    /** @var string[] Fields that all page types share */
    private const DEFAULT_FIELDS = ["id", "slug", "path", "level", "title",
                                    "layoutId", "status"];
    /** @var \Pike\Db */
    private Db $db;
    /** @var \Sivujetti\PageType\Entities\PageType[] */
    private \ArrayObject $pageTypes;
    /** @var object */
    private object $blockTypes;
    /** @var ?\Sivujetti\PageType\Entities\PageType */
    private ?PageType $pageType;
    /** @var \Sivujetti\PageType\PageTypeValidator */
    private PageTypeValidator $pageTypeValidator;
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
            $doValidateBlocks)))
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
            if ($f->dataType === "many-to-many") continue; // Not implemented yet
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
     * @param object|\Sivujetti\Page\Entities\Page $input
     * @param bool $doInsertRevision = false
     * @param ?array $theseColumnsOnly = null
     * @return int $numAffectedRows
     */
    public function updateById(PageType $pageType,
                               string $id,
                               object $input,
                               bool $doInsertRevision = false,
                               ?array $theseColumnsOnly = null): int {
        if ($theseColumnsOnly === null) {
            if (($errors = $this->pageTypeValidator->validateUpdateData($pageType, $input)))
                throw new PikeException(implode(PHP_EOL, $errors),
                                        PikeException::BAD_INPUT);
            $updateData = self::makeStorablePageDataFromValidInput($input, $pageType);
            $theseColumnsOnly = self::DEFAULT_FIELDS;
            foreach ($pageType->ownFields as $field) {
                if ($field->dataType === "many-to-many") continue; // Not implemented yet
                $theseColumnsOnly[] = $field->name;
            }
        } elseif (count($theseColumnsOnly) === 1 && $theseColumnsOnly[0] === "blocks") {
            if (($errors = $this->pageTypeValidator->validateBlocksUpdateData($input)))
                throw new PikeException(implode(PHP_EOL, $errors),
                                        PikeException::BAD_INPUT);
            $updateData = (object) ["blocks" =>
                BlockTree::toJson(BlocksController::makeStorableBlocksDataFromValidInput(
                                  $input->blocks, $this->blockTypes))
            ];
        } else {
            throw new \InvalidArgumentException("\$theseColumnsOnly supports only ['blocks'] and null");
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
     * @param bool $doIncludeLayous
     * @param string|string[] ...$filters
     * @return \Sivujetti\Page\Entities\Page[]
     */
    private function doGetMany(string|PageType $pageTypeOrPageTypeName,
                               bool $doIncludeLayouts,
                               ...$filters): array {
        $pageType = $this->getPageTypeOrThrow($pageTypeOrPageTypeName);
        $this->pageType = $pageType;
        [$filterCols, $filterVals, $joinsCols, $joins] = $this->filtersToQParts($pageType, ...$filters);
        [$baseJoinCols, $baseJoin] = !$doIncludeLayouts
            ? [",'' AS `layoutId`" .
               ",'' AS `layoutFriendlyName`" .
               ",'' AS `layoutRelFilePath`" .
               ",'' AS `layoutStructureJson`",
               ""]
            : ["," . LayoutsRepository::FIELDS,
               " LEFT JOIN `\${p}layouts` l ON (l.`id` = p.`layoutId`)"];
        //
        $ownFieldCols = [];
        foreach ($pageType->ownFields as $f) {
            if ($f->dataType === "many-to-many") continue; // Not implemented yet
            $ownFieldCols[] = "p.`$f->name` AS `$f->name`";
        }
        //
        $rows = $this->db->fetchAll(
            "SELECT p.`id`,p.`slug`,p.`path`,p.`level`,p.`title`,p.`layoutId`," .
                "p.`blocks` AS `pageBlocksJson`,'{$pageType->name}' AS `type`,p.`status`" .
                $baseJoinCols .
                ($ownFieldCols ? ("," . implode(',', $ownFieldCols)) : "") .
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
        $doIncludeLayouts = ($rows[0]?->layoutId ?? null) !== null;
        foreach ($rows as $row) {
            $row->blocks = self::blocksFromRs("pageBlocksJson", $row);
            $row->layout = $doIncludeLayouts ? Layout::fromParentRs($row) : new Layout;
            //
            foreach ($this->pageType->ownFields as $field) {
                if ($field->dataType === "many-to-many") continue; // Not implemented yet
                $row->{$field->name} = strval($row->{"{$field->name}"}); // todo cast type?
            }
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
     * @param object $input Valid $req->body
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     * @return object An object that can be passed to $db->makeUpdateQParts()
     */
    private static function makeStorablePageDataFromValidInput(object $input,
                                                               PageType $pageType): object {
        $out = (object) [
            "slug" => $input->slug,
            "path" => $input->path,
            "level" => (int) $input->level,
            "title" => $input->title,
            "layoutId" => $input->layoutId,
            "status" => (int) $input->status,
        ];
        foreach ($pageType->ownFields as $field) {
            $out->{$field->name} = $input->{$field->name} ?? null;
        }
        return $out;
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
    private function filtersToQParts(PageType $pageType, ...$filters): array {
        $filterSql = "";
        $filterValues = [];
        $escape = function (string $candidate): string {
            return $candidate !== "p.`id`" ? $this->db->columnify($candidate) : $candidate;
        };
        foreach ($filters as $inp) {
            // todo validate
            $column = key($inp);
            $cand = $inp[$column];
            $f = is_string($cand) ? ["", "", $column] : $inp;
            $filterSql .= ($f[0] ?? " AND ") . $escape($f[2]) . ($f[1] ?: "=") . "?";
            $filterValues[] = $cand;
        }
        return [$filterSql, $filterValues, "", ""];
    }
}
