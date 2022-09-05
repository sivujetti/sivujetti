<?php declare(strict_types=1);

namespace Sivujetti\ReusableBranch;

use Pike\{Request, Response};
use Pike\Db\FluentDb;
use Pike\Interfaces\RowMapperInterface;
use Sivujetti\JsonUtils;

final class ReusableBranchesController {
    /**
     * POST /api/reusable-branches: Inserts reusable content to the db.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb $db
     */
    public function create(Request $req, Response $res, FluentDb $db): void {
        file_put_contents(__DIR__."/foo.json",json_encode($req->body));
        $res->json(["ok" => "ok"]);
    }
    /**
     * GET /api/reusable-branches: Returns a list of reusable content saved to the db.
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
