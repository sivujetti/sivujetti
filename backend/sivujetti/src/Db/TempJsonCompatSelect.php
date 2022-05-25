<?php declare(strict_types=1);

namespace Sivujetti\Db;

use Envms\FluentPDO\Queries\Select;
use Pike\Db\{MongoFilters, MySelect};

class TempJsonCompatSelect extends MySelect {
    /** @var \Closure[] */
    private array $jsonFilters = [];
    /**
     * @inheritdoc
     */
    public function mongoWhere(string $mongoExpr, array $variables = []): Select {
        if (count($this->jsonFilters)) throw new \RuntimeException("Not implemented");
        [$whereSql, $whereVals] = MongoFilters::fromString($mongoExpr)->toQParts();
        //
        [$strippedWhereSql, $strippedWhereVals, $fns] = self::stripJsonExpressions($whereSql, $whereVals);
        if ($fns) {
            $whereSql = $strippedWhereSql;
            $whereVals = $strippedWhereVals;
            $this->jsonFilters = $fns;
        }
        //
        if ($whereSql) {
            // Substitute "$url" -> $variables->url etc.
            foreach ($variables as $name => $val) {
                foreach ($whereVals as $i => $val) {
                    if ($val === "\${$name}")
                        $whereVals[$i] = $val;
                }
            }
            $this->where(implode(" AND ", $whereSql), $whereVals);
        }
        return $this;
    }
    /**
     * @inheritdoc
     */
    public function fetchAll($index = "", $selectOnly = "") {
        if (!count($this->jsonFilters))
            return parent::fetchAll($index, $selectOnly);
        //
        $rows = parent::fetchAll($index, $selectOnly);
        $filtered = [];
        foreach ($rows as $row) {
            foreach ($this->jsonFilters as $boundFilter) {
                if ($boundFilter($row)) {
                    $filtered[] = $row;
                    break;
                }
            }
        }
        return $this->processAndGetResults($filtered);
    }
    /**
     * @param string[] $whereSql
     * @param mixed[] $whereVals
     * @return array{0: string[], 1: mixed[], 2: \Closure[]} [$newWhereSql, $newWhereVals, $jsonFilterFuncs]
     */
    private static function stripJsonExpressions(array $whereSql, array $whereVals): array {
        if (count($whereSql) !== count($whereVals))
            throw new \RuntimeException("Not implemented yet");
        $boundFns = [];
        foreach ($whereSql as $i => $expr) {
            if (!str_starts_with($expr, "JSON_EXTRACT(")) continue;
            //
            $val = $whereVals[$i];
            $boundFns[] = fn($row) => json_decode($row->categories)[0] === $val;
            //
            if (!str_contains($expr, ", '\$[0]') = ?")) throw new \RuntimeException("Not implemented yet");
            $t = substr($expr, strlen("JSON_EXTRACT(")); // "JSON_EXTRACT(p.`categories`, '$[0]') = ?" -> "p.`categories`, '$[0]') = ?"
            $whereSql[$i] = explode(", '", $t)[0] . " != ?"; // "p.`categories`, '$[0]') = ?" -> "p.`categories` != ?"
            $whereVals[$i] = "[]";
        }
        return [$whereSql, $whereVals, $boundFns];
    }
}
