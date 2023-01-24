<?php declare(strict_types=1);

namespace Sivujetti\GlobalBlockTree;

use Pike\{PikeException, Request, Response, Validation};
use Sivujetti\Block\{BlocksInputValidatorScanner, BlockValidator};
use Sivujetti\ValidationUtils;

final class GlobalBlockTreesController {
    /**
     * POST /api/global-block-trees: inserts new global block tree to the database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\GlobalBlockTree\GlobalBlockTreesRepository2 $gbtRepo
     * @param \Sivujetti\Block\BlocksInputValidatorScanner $scanner
     */
    public function create(Request $req,
                           Response $res,
                           GlobalBlockTreesRepository2 $gbtRepo,
                           BlocksInputValidatorScanner $scanner): void {
        if (($errors = $this->validateCreateInput($req->body))) {
            $res->status(400)->json($errors);
            return;
        }
        [$validStorableBlocksJson, $errors, $errCode] = $scanner->createStorableBlocks(fn() => [], $req,
            isInsert: true);
        if ($errCode) {
            $res->status($errCode)->json($errors);
            return;
        }
        //
        $ok = $gbtRepo->insert()
            ->values((object) [
                "id" => $req->body->id,
                "name" => $req->body->name,
                "blocks" => $validStorableBlocksJson,
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
        $gbt = $globalBlocksRepo->getSingle($req->params->globalBlockTreeId);
        $res->json($gbt);
    }
    /**
     * GET /api/global-block-trees: Lists all global block trees.
     *
     * @param \Pike\Response $res
     * @param \Sivujetti\GlobalBlockTree\GlobalBlockTreesRepository2 $globalBlocksRepo
     */
    public function list(Response $res,
                         GlobalBlockTreesRepository2 $gbtRepo): void {
        $gbts = $gbtRepo->select()->fetchAll();
        $res->json($gbts);
    }
    /**
     * PUT /api/global-block-trees/:globalBlockTreeId/blocks: Overwrites the
     * block tree of $req->params->globalBlockTreeId to the database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\GlobalBlockTree\GlobalBlockTreesRepository2 $globalBlocksRepo
     * @param \Sivujetti\Block\BlocksInputValidatorScanner $scanner
     */
    public function updateBlocks(Request $req,
                                 Response $res,
                                 GlobalBlockTreesRepository2 $gbtRepo,
                                 BlocksInputValidatorScanner $scanner): void {
        [$validStorableBlocksJson, $errors, $errCode] = $scanner->createStorableBlocks(fn() => $gbtRepo->select()
            ->where("id = ?", [$req->params->globalBlockTreeId])
            ->fetch()
            ?->blocks, $req);
        if ($errCode) {
            $res->status($errCode)->json($errors);
            return;
        }
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
     * @return string[] Error messages or []
     */
    private function validateCreateInput(object $input): array {
        return Validation::makeObjectValidator()
            ->addRuleImpl(...ValidationUtils::createPushIdValidatorImpl())
            ->rule("id", "pushId")
            ->rule("name", "type", "string")
            ->rule("name", "maxLength", ValidationUtils::INDEX_STR_MAX_LENGTH)
            ->validate($input);
    }
}
