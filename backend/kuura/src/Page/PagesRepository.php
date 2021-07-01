<?php declare(strict_types=1);

namespace KuuraCms\Page;

use KuuraCms\Page\Entities\Page;
use KuuraCms\PageType\Entities\PageType;
use KuuraCms\PageType\PageTypeValidator;
use Pike\Db;
use Pike\PikeException;

interface RepositoryInterface {
    /**
     * @return \Pike\Db
     */
    public function getDb(): Db;
    /**
     * @param \KuuraCms\Page\Entities\Page[] $rows
     * @return \KuuraCms\Page\Entities\Page[]
     */
    public function normalizeRs(array $rows): array;
}

final class PagesRepository implements RepositoryInterface {
    /** @var \Pike\Db */
    private Db $db;
    /** @var \KuuraCms\PageType\Entities\PageType */
    private PageType $pageType;
    /** @var string */
    public string $lastInsertId;
    /**
     * @param \Pike\Db $db
     */
    public function __construct(Db $db) {
        $this->db = $db;
        $this->lastInsertId = '0';
    }
    /**
     * @param \KuuraCms\PageType\Entities\PageType $pageType
     * @return \KuuraCms\Page\SelectQuery
     */
    public function getSingle(PageType $pageType): SelectQuery {
        $this->pageType = $pageType;
        return (new SelectQuery($this, true))
            ->fields(
                '${t}.`id`,${t}.`slug`,${t}.`path`,${t}.`level`,${t}.`title`,${t}.`layoutId`' .
                ',${t}.`blocks` AS `blocksJson`,"${t}" AS `pageType`' .
                ($pageType->ownFields ? ("," . implode(',', array_map(fn(object $f) =>
                    "\${t}.`$f->name` AS `$f->name`"
                , $pageType->ownFields))) : "")
            )
            ->from($pageType->name)
            ->into(Page::class);
    }
    /**
     * @param \KuuraCms\PageType\Entities\PageType $pageType
     * @param object $inputData
     * @param bool $doInsertRevision = false
     * @param bool $doInsertAsDraft = false
     * @return int $numAffectedRows
     */
    public function insert(PageType $pageType,
                           object $inputData,
                           bool $doInsertRevision = false,
                           bool $doInsertAsDraft = false): int {
        $this->lastInsertId = '0';
        if (($errors = PageTypeValidator::validateInsertData($pageType, $inputData)))
            throw new PikeException(implode(PHP_EOL, $errors),
                                    PikeException::BAD_INPUT);
        $data = new \stdClass;
        foreach (['slug','path','level','title','layoutId','blocks'] as $defaultFieldName) {
            $data->{$defaultFieldName} = $inputData->{$defaultFieldName};
        }
        foreach (['id', 'status'] as $optional) {
            if (($inputData->{$optional} ?? null) !== null)
                $data->{$optional} = $inputData->{$optional};
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
     * @inheritdoc
     */
    public function getDb(): Db {
        return $this->db;
    }
    /**
     * @inheritdoc
     */
    public function normalizeRs(array $rows): array {
        foreach ($rows as $row) {
            foreach ($this->pageType->ownFields as $field)
                $row->{$field->name} = strval($row->{"{$field->name}"}); // todo cast type?
        }
        return $rows;
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
}

// Todo
final class SelectQuery {
    /** @var \KuuraCms\Page\RepositoryInterface */
    private RepositoryInterface $repository;
    /** @var array<int, array<int, string>> */
    private array $wheres;
    /** @var \KuuraCms\Page\RepositoryInterface */
    private array $joins;
    /** @var ?string */
    private ?string $theFields;
    /** @var ?class-string */
    private ?string $Cls;
    /** @var bool */
    private bool $onlyOneRow;
    /**
     * @param \KuuraCms\Page\RepositoryInterface $repository
     * @param bool $onlyOneRow
     */
    public function __construct(RepositoryInterface $repository, bool $onlyOneRow) {
        $this->repository = $repository;
        $this->wheres = [];
        $this->joins = [];
        $this->theFields = null;
        $this->Cls = null;
        $this->onlyOneRow = $onlyOneRow;
    }
    /**
     * @param string $expr
     * @param mixed $value
     * @return $this
     */
    public function where(string $expr, $value): SelectQuery {
        $this->wheres[] = ['', $expr, $value];
        return $this;
    }
    /**
     * @param string $fields
     * @return $this
     */
    public function fields(string $fields): SelectQuery {
        $this->theFields = $fields;
        return $this;
    }
    /**
     * @param string $tableName
     * @return $this
     */
    public function from(string $tableName): SelectQuery {
        $this->tableName = "\${p}{$tableName}";
        return $this;
    }
    /**
     * @param string $expr
     * @return $this
     */
    public function join(string $expr): SelectQuery {
        $this->joins[] = $expr;
        return $this;
    }
    /**
     * @param class-string $Cls
     * @return $this
     */
    public function into(string $Cls): SelectQuery {
        $this->Cls = $Cls;
        return $this;
    }
    /**
     * @return object|array|null
     */
    public function exec(): object|array|null {
        [$sql, $values] = $this->toQParts();
        $rows = $this->repository->getDb()->fetchAll($sql, $values, \PDO::FETCH_CLASS, $this->Cls);
        $rows = $this->repository->normalizeRs($rows);
        return $this->onlyOneRow ? ($rows[0] ?? null) : $rows;
    }
    /**
     * @return array{0: string, 1: mixed[]}
     */
    private function toQParts(): array {
        $q = 'SELECT ';
        $q .= ($this->theFields ?? '*') . ' FROM ';
        $q .= "`$this->tableName` ";
        //
        foreach ($this->joins as $join)
            $q .= "JOIN {$join} ";
        //
        $values = [];
        if ($this->wheres) {
            $q .= "WHERE ";
            foreach ($this->wheres as [$conti, $expr, $value]) {
                $q .= "{$conti}{$expr}";
                $values[] = $value;
            }
        }
        return [str_replace('${t}', "`$this->tableName`", $q), $values];
    }
}
