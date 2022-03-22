<?php declare(strict_types=1);

namespace Sivujetti\GlobalBlockTree;

use Pike\Db\FluentDb;
use Pike\{PikeException, Request, Response, Validation};
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
     * GET /api/global-block-trees/:globalBlockTreeId: Retrieves a single global
     * block tree by id from the database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\GlobalBlockTree\GlobalBlockTreesRepository $globalBlocksRepo
     */
    public function getById(Request $req,
                            Response $res,
                            GlobalBlockTreesRepository $globalBlocksRepo): void {
        $blocks = $globalBlocksRepo->getSingle($req->params->globalBlockTreeId);
        $res->json($blocks);
    }
    /**
     * GET /api/global-block-trees: Lists all global block trees.
     *
     * @param \Pike\Response $res
     * @param \Sivujetti\GlobalBlockTree\GlobalBlockTreesRepository $globalBlocksRepo
     */
    public function list(Response $res,
                         GlobalBlockTreesRepository $globalBlocksRepo): void {
        $blocks = $globalBlocksRepo->getMany();
        $res->json($blocks);
    }
    /**
     * PUT /api/global-block-trees/:globalBlockTreeId/blocks: Overwrites the
     * block tree of $req->params->globalBlockTreeId to the database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\GlobalBlockTree\GlobalBlockTreesRepository $globalBlocksRepo
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
     * PUT /api/global-block-trees/:globalBlockTreeId/block-styles: Overwrites the
     * styles of $req->params->globalBlockTreeId's blocks.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb $db
     */
    public function updateOrCreateStyles(Request $req,
                                         Response $res,
                                         FluentDb $db): void {
        if (($errors = GlobalBlocksOrPageBlocksUpserter::validateInput($req->body))) {
            $res->status(400)->json($errors);
            return;
        }
        //
        [$result, $stylesExistedAlready] = GlobalBlocksOrPageBlocksUpserter::upsertStyles($req, $db, "globalBlocksStyles");
        //
        if ($stylesExistedAlready) {
            if ($result !== 1)
                throw new PikeException("Expected \$numAffectedRows to equal 1 but got {$result}",
                    PikeException::INEFFECTUAL_DB_OP);
            $res->status(200)->json(["ok" => "ok"]);
            return;
        }
        if ($result === "")
            throw new PikeException("Expected \$lastInsertId not to equal \"\"",
                PikeException::INEFFECTUAL_DB_OP);
        $res->status(201)->json(["ok" => "ok", "insertId" => $result]);
    }
    /**
     * @param object $input
     * @param \Sivujetti\Block\BlockValidator $blockValidator
     * @return string[] Error messages or []
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
