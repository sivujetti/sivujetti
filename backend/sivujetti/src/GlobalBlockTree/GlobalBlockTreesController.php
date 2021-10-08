<?php declare(strict_types=1);

namespace Sivujetti\GlobalBlockTree;

use Pike\{Request, Response, Validation};
use Sivujetti\Block\{BlockTree, BlockValidator};

final class GlobalBlockTreesController {
    private const MAX_NAME_LEN = 92;
    /**
     * POST /api/global-block-trees: inserts new global block tree to the database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\GlobalBlockTree\GlobalBlockTreesRepository $globalBlocksRepo
     * @param \Sivujetti\Block\BlockValidator $blockValidator
     */
    public function create(Request $req,
                           Response $res,
                           GlobalBlockTreesRepository $globalBlocksRepo,
                           BlockValidator $blockValidator): void {
        if (($errors = $this->validateCreateInput($req->body, $blockValidator))) {
            $res->status(400)->json($errors);
            return;
        }
        //
        $insertId = $globalBlocksRepo->insert((object) [
            "name" => $req->body->name,
            "blocks" => BlockTree::toJson($req->body->blocks),
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
     * PUT /api/ /api/global-block-trees/:globalBlockTreeId/blocks.  
     *
     */
    public function update(): void {
        throw new \RuntimeException("Not implemented yet.");
    }
    /**
     * @param object $input
     * @param \Sivujetti\Block\BlockValidator $blockValidator
     * @return string[] Error messages or []
     */
    private function validateCreateInput(object $input,
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
