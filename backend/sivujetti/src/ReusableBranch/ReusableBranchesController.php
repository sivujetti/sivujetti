<?php declare(strict_types=1);

namespace Sivujetti\ReusableBranch;

use Pike\{Request, Response, Validation};
use Pike\Db\FluentDb;
use Pike\Interfaces\RowMapperInterface;
use Pike\Validation\ObjectValidator;
use Sivujetti\{JsonUtils, ValidationUtils};
use Sivujetti\Block\BlockValidator;

final class ReusableBranchesController {
    private const T = "\${p}reusableBranches";
    /**
     * POST /api/reusable-branches: Inserts reusable content to the db.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb $db
     * @param \Sivujetti\Block\BlockValidator $blockValidator
     */
    public function create(Request $req,
                           Response $res,
                           FluentDb $db,
                           BlockValidator $blockValidator): void {
        if (($errors = $this->validateCreateInput($req->body, $blockValidator))) {
            $res->status(400)->json($errors);
            return;
        }
        //
        $numRows = $db->insert(self::T)
            ->values((object) [
                "id" => $req->body->id,
                "blockBlueprints" => JsonUtils::stringify($req->body->blockBlueprints), // Note: allow possible junk data
            ])
            ->execute(return: "numRows");
        //
        $res->json(["ok" => $numRows === 1 ? "ok" : "err",
                    "details" => $numRows === 1 ? "" : "\$numRows !== 1"]);
    }
    /**
     * GET /api/reusable-branches: Returns a list of reusable content saved to the db.
     *
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb $db
     */
    public function list(Response $res, FluentDb $db): void {
        $entities = $db->select(self::T, "\\stdClass")
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
    /**
     * @param object $input
     * @param \Sivujetti\Block\BlockValidator $dlockValidator
     * @return string[] Error messages or []
     */
    private function validateCreateInput(object $input, BlockValidator $blockValidator): array {
        if (($errors = (Validation::makeObjectValidator()
            ->addRuleImpl(...ValidationUtils::createPushIdValidatorImpl())
            ->rule("id", "pushId")
            ->rule("blockBlueprints", "minLength", "1", "array"))
            ->validate($input))) {
            return $errors;
        }
        $v = Validation::makeObjectValidator()
            ->rule("blockType", "in", $blockValidator->getValidBlockTypeNames())
            ->rule("initialOwnData", "type", "object");
        // initialDefaultsData.title|renderer etc.
        $v = $blockValidator->addRulesForDefaultProps($v, "initialDefaultsData.");
        $v = $v->rule("initialChildren", "type", "array");
        return $this->validateBlockBlueprints($input->blockBlueprints, $v);
    }
    /**
     * @param object[] $input
     * @param \Pike\Validation\ObjectValidator $v
     * @return string[] Error messages or []
     */
    private function validateBlockBlueprints(array $input, ObjectValidator $v): array {
        foreach ($input as $bb) {
            if (($errors = $v->validate($bb)))
                return $errors;
            if ($bb->initialChildren && ($errors2 = $this->validateBlockBlueprints($bb->initialChildren, $v)))
                return $errors2;
        }
        return [];
    }
}
