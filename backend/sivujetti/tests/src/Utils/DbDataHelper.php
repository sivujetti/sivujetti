<?php declare(strict_types=1);

namespace Sivujetti\Tests\Utils;

use Pike\{Db, PikeException, Validation};

final class DbDataHelper {
    /** @var \Pike\Db */
    private Db $db;
    /**
     * @param \Pike\Db $db
     */
    public function __construct(Db $db) {
        $this->db = $db;
    }
    /**
     * @param object[]|object $data
     * @param string $tableName @allow raw sql
     */
    public function insertData(array|object $data, string $tableName): void {
        if (!Validation::isIdentifier($tableName)) throw new PikeException("Wut?");
        if (is_object($data)) $data = [$data];
        [$qGroups, $vals, $cols] = $this->db->makeBatchInsertQParts($data);
        $numRows = $this->db->exec("INSERT INTO `\${p}{$tableName}` ({$cols}) VALUES {$qGroups}",
                                   $vals);
        if ($numRows !== count($data))
            throw new PikeException(sprintf("Expected to insert %d items to %s but actually inserted %d",
                                            count($data),
                                            $tableName,
                                            $numRows),
                                    PikeException::FAILED_DB_OP);
    }
    /**
     * @param string $tableName @allow raw sql
     * @param string $whereExpr = "1=1" @allow raw sql
     * @param array<int, mixed> $whereVals = []
     * @return array<string, mixed>|null
     */
    public function getRow(string $tableName,
                           string $whereExpr = "1=1",
                           array $whereVals = []): ?array {
        return $this->db->fetchOne("SELECT * FROM `\${p}{$tableName}` WHERE {$whereExpr}",
                                   $whereVals,
                                   \PDO::FETCH_ASSOC);
    }
}
