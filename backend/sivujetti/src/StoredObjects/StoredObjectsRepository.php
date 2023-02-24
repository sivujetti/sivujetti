<?php declare(strict_types=1);

namespace Sivujetti\StoredObjects;

use Pike\Db\{FluentDb, MySelect, MyUpdate};
use Pike\Interfaces\RowMapperInterface;
use Pike\PikeException;
use Sivujetti\{JsonUtils, ValidationUtils};
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
     * @param array<string, mixed> $data
     * @return string|false $lastInsertId
     * @throws \Pike\PikeException|\JsonException If $data is not valid or too large, or database op fails
     */
    public function putEntry(string $objectName, array $data): string {
        $asJson = self::stringifyDataOrThrow($data);
        return $this->db->insert(self::T)
            ->values([(object) ["objectName" => $objectName, "data" => $asJson]])
            ->execute();
    }
    /**
     * @param string $objectName e.g. "JetForms:mailSendSettings" or "JetForms:submissions"
     * @return \Pike\Db\MySelect
     */
    public function find(string $objectName): MySelect {
        return $this->db->select(self::T, Entry::class)
            ->fields(["objectName", "data AS dataJson"])
            ->where("objectName = ?", [$objectName])
            ->mapWith(new class implements RowMapperInterface {
                public function mapRow(object $row, int $rowNum, array $rows): ?object {
                    $row->data = json_decode($row->dataJson, associative: true, flags: JSON_THROW_ON_ERROR);
                    return $row;
                }
            });
    }
    /**
     * @param string $objectName e.g. "JetForms:mailSendSettings"
     * @param array<string, mixed> $data e.g. {sendingMethod: "mail", ...}
     * @return \Pike\Db\MyUpdate
     * @throws \Pike\PikeException|\JsonException If $data is not valid or too large
     */
    public function updateEntry(string $objectName, array $data): MyUpdate {
        $asJson = self::stringifyDataOrThrow($data);
        return $this->db
            ->update(self::T)
            ->values((object) ["data" => $asJson])
            ->where("objectName = ?", [$objectName]);
    }
    /**
     * @param array $data e.g. {sendingMethod: "mail", ...}
     * @return string $json
     * @throws \Pike\PikeException|\JsonException If $data is not valid or too large
     */
    private static function stringifyDataOrThrow(array $data): string {
        // @allow \JsonException
        $asJson = JsonUtils::stringify($data);
        if (strlen($asJson) > (ValidationUtils::HARD_JSON_TEXT_MAX_LEN * 8)) // ~4MB
            throw new PikeException("Json too large", PikeException::BAD_INPUT);
        return $asJson;
    }
}
