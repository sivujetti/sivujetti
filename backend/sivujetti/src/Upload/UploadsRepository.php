<?php declare(strict_types=1);

namespace Sivujetti\Upload;

use Pike\Db;
use Sivujetti\Upload\Entities\UploadsEntry;

final class UploadsRepository {
    /** @var \Pike\Db */
    private Db $db;
    /**
     * @param \Pike\Db $db
     */
    public function __construct(Db $db) {
        $this->db = $db;
    }
    /**
     * @param \Sivujetti\Upload\UploadsQFilters $filters
     * @return \Sivujetti\Upload\Entities\UploadsEntry[]
     */
    public function getMany(UploadsQFilters $filters): array {
        [$whereSql, $whereVals] = $filters->toQParts();
        // @allow \Pike\PikeException
        return $this->db->fetchAll("SELECT * FROM `\${p}files`" .
                                   " WHERE {$whereSql}" .
                                   " LIMIT 20",
                                   $whereVals,
                                   \PDO::FETCH_CLASS,
                                   UploadsEntry::class);
    }
}
