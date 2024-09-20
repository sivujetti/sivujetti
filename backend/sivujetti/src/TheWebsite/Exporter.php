<?php declare(strict_types=1);

namespace Sivujetti\TheWebsite;

use Pike\Db\FluentDb2;
use Pike\{AppConfig, Db};

/**
 * @psalm-type ColumnInfo = array{tableName: string, entities: array<int, \stdClass>}
 */
final class Exporter {
    /** @var \Pike\Db\FluentDb2 */
    private FluentDb2 $db2;
    /** @var \Pike\AppConfig */
    private AppConfig $config;
    /**
     * @param \Pike\Db\FluentDb2 $db2
     * @param \Pike\AppConfig $config
     */
    public function __construct(FluentDb2 $db2, AppConfig $config) {
        $this->db2 = $db2;
        $this->config = $config;
    }
    /**
     * @param string $tableName
     * @param \Pike\Db $db
     * @param string $driver
     * @param ?string $schemaName = null
     * @psalm-return ColumnInfo[]
     */
    public static function describeTableColums(string $tableName, Db $db, string $driver, ?string $schemaName = null): array {
        $prefixedTableName = $db->compileQuery("\${p}{$tableName}");
        if ($driver === "sqlite")
            return $db->fetchAll(
                "SELECT `name` AS colName, cid + 1 AS ordinal, " .
                "CASE WHEN `notnull` == 0 THEN 'NO' ELSE 'YES' END AS isNullable, `type` AS dataType " .
                "FROM pragma_table_info(?)",
                [$prefixedTableName]
            );
        else
            return $db->fetchAll(
                "SELECT COLUMN_NAME AS colName, ORDINAL_POSITION AS ordinal, " .
                "IS_NULLABLE AS isNullable, DATA_TYPE AS dataType " .
                "FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
                [$schemaName, $prefixedTableName]
            );
    }
    /**
     * @psalm-return ColumnInfo[]
     */
    public function export(): array {
        $dbDriver = $this->config->get("db.driver");
        $orderedTableNames = $this->orderedTableNamesOfCurrentSchema($dbDriver);

        $schemaName = $dbDriver === "sqlite" ? null : $this->config->get("db.database");
        $out = [];
        for ($i = 0; $i < count($orderedTableNames); ++$i) {
            $tableName = $orderedTableNames[$i];
            //
            $columnInfos = self::describeTableColums(
                $tableName,
                $this->db2->getDb(),
                $dbDriver,
                $schemaName
            );
            //
            $entities = $this->getEachRowFrom($tableName, $columnInfos);
            //
            $cleaned = $this->cleanEachRowOf($tableName, $entities);
            //
            $out[] = (object) ["tableName" => $tableName, "entities" => $cleaned];
        }

        return $out;
    }
    /**
     * @param string $dbDriver
     * @return string[]
     */
    private function orderedTableNamesOfCurrentSchema(string $dbDriver): array {
        $stmts = include SIVUJETTI_BACKEND_PATH . "installer/schema.{$dbDriver}.php";
        $filtered = array_filter($stmts, fn ($stmt) => str_starts_with($stmt, "CREATE TABLE "));
        $noPrefixes = array_map(function ($line) {
            $tmp = explode("\${p}", $line)[1]; // "CREATE TABLE `\${p}users` (" -> "users` ("
            return explode("`", $tmp)[0]; // "users` (" -> "users"
        }, $filtered);
        $builtins = [
            "users",
            "storedObjects",
            "plugins",
            "jobs",
            "snapshots",
        ];
        $noBuiltin = array_filter($noPrefixes, fn($tableName) => !in_array($tableName, $builtins, true));
        return array_values($noBuiltin);
    }
    /**
     * @param string $tableName
     * @psalm-param ColumnInfo[] $infos
     * @return \stdClass[]
     */
    private function getEachRowFrom(string $tableName, array $infos): array {
        $cols = array_column($infos, "colName");
        return $this->db2->select("`\${p}{$tableName}`")
            ->fields($cols)
            ->limit(1000)
            ->fetchAll(\PDO::FETCH_OBJ);
    }
    /**
     * @param string $tableName
     * @param \stdClass[] $entities Note: mutates this
     * @return \stdClass[]
     */
    private function cleanEachRowOf(string $tableName, array $entities): array {
        if ($tableName === "theWebsite") {
            for ($i = 0; $i < count($entities); ++$i)
                $entities[$i]->firstRuns = "{}";
        }
        return $entities;
    }
}
