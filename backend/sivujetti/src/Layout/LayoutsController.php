<?php declare(strict_types=1);

namespace Sivujetti\Layout;

use Pike\{PikeException, Request, Response, Validation};
use Sivujetti\Block\BlockValidator;

final class LayoutsController {
    /** @var \Sivujetti\Block\BlockValidator $blockValidator */
    private BlockValidator $blockValidator;
    /**
     * @param \Sivujetti\Block\BlockValidator $blockValidator
     */
    public function __construct(BlockValidator $blockValidator) {
        $this->blockValidator = $blockValidator;
    }
    /**
     * GET /api/layouts: returns a list of layouts.
     *
     * @param \Pike\Response $res
     * @param \Sivujetti\Layout\LayoutsRepository $layoutsRepo
     */
    public function list(Response $res, LayoutsRepository $layoutsRepo): void {
        $all = $layoutsRepo->getMany();
        $res->json($all);
    }
    /**
     * PUT /api/layouts/[i:layoutId]/structure: Overwrites the structure tree of
     * $req->params->layoutId.  
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Layout\LayoutsRepository $layoutsRepo
     */
    public function updateLayoutStructure(Request $req,
                                          Response $res,
                                          LayoutsRepository $layoutsRepo): void {
        if (($errors = $this->validateUpdateBlocksInput($req->body))) {
            $res->status(400)->json($errors);
            return;
        }
        $num = $layoutsRepo->updateById($req->params->layoutId, $req->body);
        //
        if ($num !== 1)
            throw new PikeException("Expected \$numAffectedRows to equal 1 but got $num",
                PikeException::INEFFECTUAL_DB_OP);
        //
        $res->status(200)->json(["ok" => "ok"]);
    }
    /**
     * @param object $input
     * @return string[] Error messages or []
     */
    private function validateUpdateBlocksInput(object $input): array {
        if (($errors = Validation::makeObjectValidator()
            ->rule("blocks", "minLength", "1", "array")
            ->validate($input))) {
            return $errors;
        }
        return $this->blockValidator->validateMany($input->blocks);
    }
}
