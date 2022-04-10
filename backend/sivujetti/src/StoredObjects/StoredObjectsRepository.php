<?php declare(strict_types=1);

namespace Sivujetti\StoredObjects;

use Pike\Db\FluentDb;
use Pike\Interfaces\RowMapperInterface;
use Sivujetti\StoredObjects\Entities\Entry;

class StoredObjectsRepository {
    private const T = "\${p}storedObjects";
    /** @var \Pike\Db\FluentDb */
    private FluentDb $db;
    /**
     * @param \Pike\Db\FluentDb $db
     */
    public function __construct(FluentDb $db) {
        $this->db = $db;
    }
    /**
     * @param string $objectName e.g. "JetForms:mailSendSettings"
     * @return ?\SitePlugins\JetForms\Entities\Entry
     */
    public function getEntry(string $objectName): ?Entry {
        return $this->db->select(self::T, Entry::class)
            ->fields(["objectName", "data AS dataJson"])
            ->where("objectName = ?", [$objectName])
            ->mapWith(new class implements RowMapperInterface {
                public function mapRow(object $row, int $rowNum, array $rows): ?object {
                    $row->data = json_decode($row->dataJson, associative: true, flags: JSON_THROW_ON_ERROR);
                    return $row;
                }
            })
            ->fetch() ?? null;
    }
}
