<?php declare(strict_types=1);

namespace Sivujetti\Tests\Utils;

use Pike\Db;
use Sivujetti\Layout\Entities\Layout;

final class LayoutTestUtils {
    public const TEST_LAYOUT_FILENAME = "layout.default.tmpl.php";
    /** @var Sivujetti\Tests\Utils\DbDataHelper */
    private DbDataHelper $dbDataHelper;
    /**
     * @param \Pike\Db $db
     */
    public function __construct(Db $db) {
        $this->dbDataHelper = new DbDataHelper($db);
    }
    /**
     * @param object $data \Sivujetti\Layout\Entities\Layout|object
     * @return string $lastInsertId
     */
    public function insertLayout(object $data): string {
        if (!is_string($data->id ?? null))
            throw new \RuntimeException("data->id is required");
        if ($this->dbDataHelper->getDb()->fetchOne("SELECT `id` FROM `layouts` WHERE `id`=?", [$data->id]))
            return $data->id;
        return $this->dbDataHelper->insertData((object) [
            "id" => $data->id,
            "friendlyName" => $data->friendlyName ?? "Default",
            "relFilePath" => $data->relFilePath ?? self::TEST_LAYOUT_FILENAME,
            "structure" => json_encode(is_array($data->structure ?? null)
                ? $data->structure
                : [(object) ["type" => Layout::PART_TYPE_PAGE_CONTENTS]]),
        ], "layouts");
    }
    /**
     * @return string $lastInsertId
     */
    public function insertDefaultLayout(): string {
        return $this->insertLayout((object) ["id" => "1"]);
    }
}
