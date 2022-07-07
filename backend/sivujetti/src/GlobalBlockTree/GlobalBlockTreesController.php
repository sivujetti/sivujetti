<?php declare(strict_types=1);

namespace Sivujetti\GlobalBlockTree;

use Pike\Db\FluentDb;
use Pike\{PikeException, Request, Response, Validation};
use Sivujetti\Block\{BlockPropDiffChecker, BlocksController, BlockTree, BlockValidator};
use Sivujetti\BlockType\Entities\BlockTypes;
use Sivujetti\Theme\ThemeCssFileUpdaterWriter;

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
        if (($errors = $this->validateInput($req->body, $blockValidator))) {
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
     * PUT /api/global-block-trees/:globalBlockTreeId/block-styles/:themeId: Overwrites
     * the styles of $req->params->globalBlockTreeId's blocks that are linked to
     * $req->params->themeId.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Pike\Db\FluentDb $db
     * @param \Sivujetti\Theme\ThemeCssFileUpdaterWriter $cssGen
     */
    public function upsertStyles(Request $req,
                                 Response $res,
                                 FluentDb $db,
                                 ThemeCssFileUpdaterWriter $cssGen): void {
        if (($errors = GlobalBlocksOrPageBlocksUpserter::validateInput($req->body))) {
            $res->status(400)->json($errors);
            return;
        }
        //
        [$result, $error, $stylesExistedAlready] = GlobalBlocksOrPageBlocksUpserter::upsertStyles(
            $req, $db, "globalBlocksStyles", $cssGen);
        //
        if ($error)
            throw new PikeException($error, PikeException::ERROR_EXCEPTION);
        if ($stylesExistedAlready)
            $res->status(200)->json(["ok" => "ok"]);
        else
            $res->status(201)->json(["ok" => "ok", "insertId" => $result]);
    }
    /**
     * @param object $input
     * @param \Sivujetti\Block\BlockValidator $blockValidator
     * @return string[] Error messages or []
     */
    private function validateInput(object $input,
                                   BlockValidator $blockValidator): array {
        if (($errors = Validation::makeObjectValidator()
            ->rule("name", "type", "string")
            ->rule("name", "maxLength", self::MAX_NAME_LEN)
            ->rule("blocks", "minLength", "1", "array")
            ->validate($input))) {
            return $errors;
        }
        return $blockValidator->validateMany($input->blocks);
    }
}
