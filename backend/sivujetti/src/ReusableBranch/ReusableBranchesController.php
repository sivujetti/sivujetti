<?php declare(strict_types=1);

namespace Sivujetti\ReusableBranch;

use Pike\{Request, Response, Validation};
use Pike\Db\FluentDb2;
use Pike\Validation\ObjectValidator;
use Sivujetti\{JsonUtils, ValidationUtils};
use Sivujetti\Block\BlockValidator;
use Sivujetti\Theme\ThemesController;

/**
 * @psalm-import-type BlockBlueprint from \Sivujetti\Block\Entities\Block
 */
final class ReusableBranchesController {
    private const T = "\${p}reusableBranches";
    /**
     * POST /api/reusable-branches: Inserts reusable content to the db.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb2 $db2
     * @param \Sivujetti\Block\BlockValidator $blockValidator
     */
    public function upsert(Request $req,
                           Response $res,
                           FluentDb2 $db2,
                           BlockValidator $blockValidator): void {
        if (($errors = self::validateUpsertInput($req->body, $blockValidator))) {
            $res->status(400)->json($errors);
            return;
        }
        //
        $numRows = $db2->insert(self::T, orReplace: true)
            ->values((object) [
                "id" => $req->body->id,
                "blockBlueprints" => JsonUtils::stringify($req->body->blockBlueprints), // Note: allow possible junk data
            ])
            ->execute(return: "numRows");
        //
        $res->json(["ok" => "ok",
                    "details" => $numRows === 1 ? "" : "\$numRows !== 1"]);
    }
    /**
     * GET /api/reusable-branches: Returns a list of reusable content saved to the db.
     *
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb2 $db2
     */
    public function list(Response $res, FluentDb2 $db2): void {
        $entities = $db2->select(self::T)
            ->fields(["id", "blockBlueprints"])
            ->limit(80)
            ->fetchAll(fn(string $id, string $blockBlueprints) => (object) [
                "id" => $id,
                "blockBlueprints" => JsonUtils::parse($blockBlueprints),
            ]);
        $res->json($entities);
    }
    /**
     * @param object $input
     * @return object
     * @psalm-return BlockBlueprint
     */
    public static function objectToBlueprint(object $input): object {
        $defaults = $input->initialDefaultsData;
        return (object) [
            "blockType" => $input->blockType,
            "initialOwnData" => $input->initialOwnData,
            "initialDefaultsData" => (object) [
                "title" => $defaults->title,
                "renderer" => $defaults->renderer,
                "styleClasses" => $defaults->styleClasses,
            ],
            "initialStyles" => $input->initialStyles,
            "initialChildren" => array_map(self::objectToBlueprint(...), $input->initialChildren),
        ];
    }
    /**
     * @param object $input
     * @param \Sivujetti\Block\BlockValidator $blockValidator
     * @return string[] Error messages or []
     */
    private static function validateUpsertInput(object $input, BlockValidator $blockValidator): array {
        $errors1 = Validation::makeObjectValidator()
            ->addRuleImpl(...ValidationUtils::createPushIdValidatorImpl())
            ->rule("id", "pushId")
            ->validate($input);
        $errors2 = self::validateBlockBlueprints($input, $blockValidator, "blockBlueprints");
        return [...$errors1, ...$errors2];
    }
    /**
     * @param object $input
     * @param \Sivujetti\Block\BlockValidator $blockValidator
     * @param string $propPath = "blockBlueprints"
     * @return string[] Error messages or []
     */
    public static function validateBlockBlueprints(object $input,
                                                   BlockValidator $blockValidator,
                                                   string $propPath = "blockBlueprintFields"): array {
        if (($errors = Validation::makeObjectValidator()
            ->rule($propPath, "minLength", 1, "array")
            ->validate($input))) {
            return $errors;
        }
        $v = Validation::makeObjectValidator()
            ->rule("blockType", "in", $blockValidator->getValidBlockTypeNames())
            ->rule("initialOwnData", "type", "object");
        // initialDefaultsData.title|renderer etc.
        $v = $blockValidator->addRulesForDefaultProps($v, "initialDefaultsData.");
        // initialStyles.scss|scope|data
        $v = ThemesController::addRulesForStyleChunks($v, "initialStyles");
        $v = $v->rule("initialChildren", "type", "array");
        return self::doValidateBlockBlueprints($input->{$propPath}, $v);
    }
    /**
     * @param object[] $input
     * @param \Pike\Validation\ObjectValidator $v
     * @return string[] Error messages or []
     */
    private static function doValidateBlockBlueprints(array $input, ObjectValidator $v): array {
        foreach ($input as $bb) {
            if (($errors = $v->validate($bb)))
                return $errors;
            if ($bb->initialChildren && ($errors2 = self::doValidateBlockBlueprints($bb->initialChildren, $v)))
                return $errors2;
        }
        return [];
    }
}
