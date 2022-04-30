<?php declare(strict_types=1);

namespace Sivujetti\StoredObjects;

use Pike\Db\FluentDb;
use Pike\Interfaces\RowMapperInterface;
use Pike\PikeException;
use Sivujetti\StoredObjects\Entities\Entry;
use Sivujetti\ValidationUtils;

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
    /**
     * Important: $validateData must be validated before calling this method!
     *
     * @param string $objectName e.g. "JetForms:mailSendSettings"
     * @param object $validatedData e.g. {sendingMethod: "mail", ...}
     * @return int $numAffectedRows
     * @throws \Pike\PikeException If length of $validatedData->* too big
     */
    public function updateEntryData(string $objectName, object $validatedData): int {
        $asJson = json_encode($validatedData, flags: JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
        if (strlen($asJson) > (ValidationUtils::HARD_JSON_TEXT_MAX_LEN * 16)) // ~4MB
            throw new PikeException("Json too large", PikeException::BAD_INPUT);
        return $this->db
            ->update(self::T)
            ->values((object) ["data" => $asJson])
            ->where("objectName = ?", [$objectName])
            ->execute();
    }
}
