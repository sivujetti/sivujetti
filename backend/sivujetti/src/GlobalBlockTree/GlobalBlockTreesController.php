<?php declare(strict_types=1);

namespace Sivujetti\GlobalBlockTree;

use Pike\{ObjectValidator, PikeException, Request, Response, Validation};
use Sivujetti\Block\{BlocksController, BlockTree, BlockValidator};
use Sivujetti\BlockType\Entities\BlockTypes;

final class GlobalBlockTreesController {
    private const MAX_NAME_LEN = 92;
    /**
     * POST /api/global-block-trees: inserts new global block tree to the database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\GlobalBlockTree\GlobalBlockTreesRepository $globalBlocksRepo
     * @param \Sivujetti\Block\BlockValidator $blockValidator
     * @param \Sivujetti\BlockType\Entities\BlockTypes $blockTypes
     */
    public function create(Request $req,
                           Response $res,
                           GlobalBlockTreesRepository $globalBlocksRepo,
                           BlockValidator $blockValidator,
                           BlockTypes $blockTypes): void {
        if (($errors = $this->validateInput($req->body, $blockValidator, "all"))) {
            $res->status(400)->json($errors);
            return;
        }
        //
        $insertId = $globalBlocksRepo->insert((object) [
            "name" => $req->body->name,
            "blocks" => BlockTree::toJson(
                BlocksController::makeStorableBlocksDataFromValidInput($req->body->blocks,
                    $blockTypes)
            ),
        ]);
        //
        $res->status($insertId !== "" ? 201 : 200)->json(["insertId" => $insertId]);
    }
    /**
     * GET /api/global-block-trees: .
     *
     */
    public function list(): void {
        throw new \RuntimeException("Not implemented yet.");
    }
    /**
     * PUT /api/global-block-trees/i:globalBlockTreeId/blocks: Overwrites the
     * block tree of $req->params->globalBlockTreeId to the database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Block\GlobalBlockTreesRepository $globalBlocksRepo
     * @param \Sivujetti\Block\BlockValidator $blockValidator
     * @param \Sivujetti\BlockType\Entities\BlockTypes $blockTypes
     */
    public function update(Request $req,
                           Response $res,
                           GlobalBlockTreesRepository $globalBlocksRepo,
                           BlockValidator $blockValidator,
                           BlockTypes $blockTypes): void {
        if (($errors = $this->validateInput($req->body, $blockValidator, "blocks"))) {
            $res->status(400)->json($errors);
            return;
        }
        $num = $globalBlocksRepo->updateById($req->params->globalBlockTreeId, (object) [
            "blocks" => BlockTree::toJson(
                BlocksController::makeStorableBlocksDataFromValidInput($req->body->blocks, $blockTypes)
            )
        ]);
        //
        if ($num !== 1)
            throw new PikeException("Expected \$numAffectedRows to equal 1 but got $num",
                PikeException::INEFFECTUAL_DB_OP);
        //
        $res->status(200)->json(["ok" => "ok"]);
    }
    /**
     */
    private function validateInput(object $input,
                                   BlockValidator $blockValidator,
                                   string $fields = "all"): array {
        $validator = Validation::makeObjectValidator();
        if ($fields === "all") {
            $validator
                ->rule("name", "type", "string")
                ->rule("name", "maxLength", self::MAX_NAME_LEN);
        }
        if (($errors = $validator
            ->rule("blocks", "minLength", "1", "array")
            ->validate($input))) {
            return $errors;
        }
        return $blockValidator->validateMany($input->blocks);
    }
}
