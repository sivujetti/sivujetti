<?php declare(strict_types=1);

namespace Sivujetti\StoredObjects;

use Pike\Db\{FluentDb2, Query};
use Pike\PikeException;
use Sivujetti\{JsonUtils, ValidationUtils};
use Sivujetti\StoredObjects\Entities\Entry;

final class StoredObjectsRepository {
    private const T = "\${p}storedObjects";
    /** @var \Pike\Db\FluentDb2 */
    private FluentDb2 $db2;
    /**
     * @param \Pike\Db\FluentDb2 $db2
     */
    public function __construct(FluentDb2 $db2) {
        $this->db2 = $db2;
    }
    /**
     * @param string $objectName e.g. "JetForms:mailSendSettings"
     * @param array<string, mixed> $data
     * @return string|false $lastInsertId
     * @throws \Pike\PikeException|\JsonException If $data is not valid or too large, or database op fails
     */
    public function putEntry(string $objectName, array $data): string|false {
        $asJson = self::stringifyDataOrThrow($data);
        return $this->db2->insert(self::T)
            ->values([(object) ["objectName" => $objectName, "data" => $asJson]])
            ->execute();
    }
    /**
     * @param string $objectName e.g. "JetForms:mailSendSettings" or "JetForms:submissions"
     * @return \Pike\Db\Query
     */
    public function find(string $objectName): Query {
        return $this->db2->select(self::T)
            ->fields(["objectName", "data AS dataJson"])
            ->where("objectName = ?", [$objectName])
            ->fetchWith(function (string $objectName, string $dataJson) {
                $out = new Entry();
                $out->objectName = $objectName;
                $out->data = JsonUtils::parse($dataJson, asObject: false);
                $out->dataJson = $dataJson;
                return $out;
            });
    }
    /**
     * @param string $objectName e.g. "JetForms:mailSendSettings"
     * @param array<string, mixed> $data e.g. {sendingMethod: "mail", ...}
     * @return \Pike\Db\Query
     * @throws \Pike\PikeException|\JsonException If $data is not valid or too large
     */
    public function updateEntry(string $objectName, array $data): Query {
        $asJson = self::stringifyDataOrThrow($data);
        return $this->db2
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
