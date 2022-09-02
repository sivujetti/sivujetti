<?php declare(strict_types=1);

namespace Sivujetti\ReusableBranch;

use Pike\{Response};
use Pike\Db\FluentDb;
use Pike\Interfaces\RowMapperInterface;
use Sivujetti\JsonUtils;

final class ReusableBranchesController {
    /**
     * GET /api/reusable-branches: Returns a list of reusable content saved to db.
     *
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb $db
     */
    public function list(Response $res, FluentDb $db): void {
        $entities = $db->select("\${p}reusableBranches", "\\stdClass")
            ->fields(["id", "blockBlueprints as blockBlueprintsJson"])
            ->mapWith(new class implements RowMapperInterface {
                public function mapRow(object $row, int $_numRow, array $_rows): object {
                    $row->blockBlueprints = JsonUtils::parse($row->blockBlueprintsJson);
                    unset($row->blockBlueprintsJson);
                    return $row;
                }
            })
            ->limit(20)
            ->fetchAll();
        $res->json($entities);
    }
}
