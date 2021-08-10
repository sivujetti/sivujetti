<?php declare(strict_types=1);

namespace Sivujetti\Layout;

use Pike\{PikeException, Request, Response, Validation};
use Sivujetti\Block\BlockValidator;
use Sivujetti\BlockType\Entities\BlockTypes;

final class LayoutsController {
    /** @var \Sivujetti\Block\BlockValidator $blockValidator */
    private BlockValidator $blockValidator;
    /** @var object */
    private object $blockTypes;
    /**
     * @param \Sivujetti\Block\BlockValidator $blockValidator
     * @param \Sivujetti\SharedAPIContext $storage  
     */
    public function __construct(BlockValidator $blockValidator, BlockTypes $blockTypes) {
        $this->blockValidator = $blockValidator;
        $this->blockTypes = $blockTypes;
    }
    /**
     * PUT /api/layouts/[i:layoutId]/blocks: Overwrites the block tree of
     * $req->params->layoutId.  
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Layout\LayoutBlocksRepository $layoutBlocksRepo 
     */
    public function updateLayoutBlocks(Request $req,
                                       Response $res,
                                       LayoutBlocksRepository $layoutBlocksRepo): void {
        if (($errors = $this->validateUpdateBlocksInput($req->body))) {
            $res->status(400)->json($errors);
            return;
        }
        $num = $layoutBlocksRepo->updateById($req->params->layoutId,
                                             $req->body->blocks);
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
        $v = Validation::makeObjectValidator()
            ->rule("blocks", "minLength", "1", "array");
        if (!($errors = $v->validate($input)))
            $errors = $this->blockValidator->validateMany($input->blocks,
                                                          $this->blockTypes);
        return $errors;
    }
}
