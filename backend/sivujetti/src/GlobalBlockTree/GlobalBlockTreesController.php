<?php declare(strict_types=1);

namespace Sivujetti\GlobalBlockTree;

use Pike\{PikeException, Request, Response, Validation};
use Sivujetti\Block\{BlockPropDiffChecker, BlocksController, BlockTree, BlockValidator};
use Sivujetti\BlockType\Entities\BlockTypes;
use Sivujetti\ValidationUtils;

final class GlobalBlockTreesController {
    private const MAX_NAME_LEN = 92;
    /**
     * POST /api/global-block-trees: inserts new global block tree to the database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\GlobalBlockTree\GlobalBlockTreesRepository2 $gbtRepo
     * @param \Sivujetti\Block\BlockValidator $blockValidator
     * @param \Sivujetti\BlockType\Entities\BlockTypes $blockTypes
     */
    public function create(Request $req,
                           Response $res,
                           GlobalBlockTreesRepository2 $gbtRepo,
                           BlockValidator $blockValidator,
                           BlockTypes $blockTypes): void {
        if (($errors = $this->validateInput($req->body, $blockValidator))) {
            $res->status(400)->json($errors);
            return;
        }
        //
        $ok = $gbtRepo->insert()
            ->values((object) [
                "id" => $req->body->id,
                "name" => $req->body->name,
                "blocks" => BlockTree::toJson(
                    BlocksController::makeStorableBlocksDataFromValidInput($req->body->blocks,
                        $blockTypes)
                )
            ])
            ->execute(return: "numRows") === 1;
        //
        $res->status($ok ? 201 : 200)->json(["ok" => $ok ? "ok" : "err"]);
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
     * @param \Sivujetti\GlobalBlockTree\GlobalBlockTreesRepository2 $globalBlocksRepo
     */
    public function list(Response $res,
                         GlobalBlockTreesRepository2 $gbtRepo): void {
        $blocks = $gbtRepo->select()->fetchAll();
        $res->json($blocks);
    }
    /**
     * PUT /api/global-block-trees/:globalBlockTreeId/blocks: Overwrites the
     * block tree of $req->params->globalBlockTreeId to the database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\GlobalBlockTree\GlobalBlockTreesRepository2 $globalBlocksRepo
     * @param \Sivujetti\Block\BlockPropDiffChecker $checker
     */
    public function updateBlocks(Request $req,
                                 Response $res,
                                 GlobalBlockTreesRepository2 $gbtRepo,
                                 BlockPropDiffChecker $checker): void {
        $validStorableBlocksJson = $checker->runChecksAndMutateResp(fn() => $gbtRepo->select()
            ->where("id = ?", [$req->params->globalBlockTreeId])
            ->fetch()
            ?->blocks, $req, $res);
        if (!$validStorableBlocksJson) return;
        //
        $numAffectedRows = $gbtRepo->update()
            ->values((object) ["blocks" => $validStorableBlocksJson])
            ->where("id = ?", $req->params->globalBlockTreeId)
            ->execute();
        //
        if ($numAffectedRows !== 1) throw new PikeException(
            "Expected \$numAffectedRows to equal 1 but got {$numAffectedRows}",
            PikeException::INEFFECTUAL_DB_OP);
        //
        $res->status(200)->json(["ok" => "ok"]);
    }
    /**
     * @param object $input
     * @param \Sivujetti\Block\BlockValidator $blockValidator
     * @return string[] Error messages or []
     */
    private function validateInput(object $input,
                                   BlockValidator $blockValidator): array {
        if (($errors = Validation::makeObjectValidator()
            ->addRuleImpl(...ValidationUtils::createPushIdValidatorImpl())
            ->rule("id", "pushId")
            ->rule("name", "type", "string")
            ->rule("name", "maxLength", self::MAX_NAME_LEN)
            ->rule("blocks", "minLength", "1", "array")
            ->validate($input))) {
            return $errors;
        }
        return $blockValidator->validateMany($input->blocks);
    }
}
