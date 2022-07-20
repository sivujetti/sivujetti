<?php declare(strict_types=1);

namespace Sivujetti\Block;

use Pike\{ArrayUtils, Request, Response, Validation};
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\{BlockTypeInterface, PropertiesBuilder};
use Sivujetti\BlockType\Entities\BlockTypes;
use Sivujetti\GlobalBlockTree\GlobalBlockTreesRepository2;
use Sivujetti\Page\{PagesController, PagesRepository, WebPageAwareTemplate};
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\SharedAPIContext;
use Sivujetti\TheWebsite\Entities\TheWebsite;

final class BlocksController {
    /**
     * POST /api/blocks/render: Renders $req->body->block using $req->body->block->
     * render -template. Returns 400 (or throws an exception) if the block or its
     * properties isn't valid.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\Block\BlockValidator $blockValidator
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     * @param \Sivujetti\Page\PagesRepository $pagesRepo
     * @param \Sivujetti\SharedAPIContext $apiCtx
     */
    public function render(Request $req,
                           Response $res,
                           BlockValidator $blockValidator,
                           TheWebsite $theWebsite,
                           PagesRepository $pagesRepo,
                           SharedAPIContext $apiCtx): void {
        if (($errors = self::validateRenderBlockInput($req->body)) ||
            ($errors = $blockValidator->validateInsertOrUpdateData($req->body->block->type,
                                                                   $req->body->block))) {
            $res->status(400)->json($errors);
            return;
        }
        //
        $block = Block::fromObject($req->body->block);
        $marker = new Block;
        $marker->type = "__marker";
        $block->children = [$marker];
        //
        PagesController::runBlockBeforeRenderEvent([$block], $apiCtx->blockTypes,
                                                   $pagesRepo, $theWebsite);
        $pagePageType = ArrayUtils::findByKey($theWebsite->pageTypes, PageType::PAGE, "name");
        $html = (new WebPageAwareTemplate($block->renderer,
            initialLocals: [
                "currentPage" => PagesController::createEmptyPage($pagePageType),
                "currentUrl" => "",
                "site" => $theWebsite,
            ],
            pluginNames: array_map(fn($p) => $p->name, $theWebsite->plugins->getArrayCopy())
        ))->renderBlocks([$block]);
        $res->json(json_encode(["result" => $html], JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE));
    }
    /**
     * GET /api/blocks/[w:type]: Returns a list of global block tree blocks with
     * type $req->params->type.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\GlobalBlockTree\GlobalBlockTreesRepository2 $gbtRepo
     */
    public function list(Request $req,
                         Response $res,
                         GlobalBlockTreesRepository2 $gbtRepo): void {
        $gbts = $gbtRepo->select()->fetchAll();
        $out = [];
        $onlyOfType = $req->params->type;
        $predicate = fn($block) => $block->type === $onlyOfType;
        foreach ($gbts as $gbt) {
            foreach (BlockTree::filterBlocks($gbt->blocks, $predicate) as $block)
                $out[$block->id] = (object) ["block" => $block, "containingGlobalBlockTree" => $gbt];
        }
        $res->json(array_values($out));
    }
    /**
     * @return \Sivujetti\BlockType\BlockTypeInterface $blockType
     * @param object $input
     * @return object
     */
    public static function makeStorableBlockDataFromValidInput(BlockTypeInterface $blockType,
                                                               object $input): object {
        $out = (object) [
            "type" => $input->type,
            "title" => $input->title,
            "renderer" => $input->renderer,
            "id" => $input->id,
            "children" => [],
            "propsData" => [],
            "styleClasses" => $input->styleClasses,
        ];
        foreach ($blockType->defineProperties(new PropertiesBuilder) as $prop)
            $out->propsData[] = (object) ["key" => $prop->name, "value" => $input->{$prop->name}];
        return $out;
    }
    /**
     * @param object[] $branch
     * @param \Sivujetti\BlockType\Entities\BlockTypes $blockTypes
     * @return array
     */
    public static function makeStorableBlocksDataFromValidInput(array $branch,
                                                                BlockTypes $blockTypes): array {
        $out = [];
        foreach ($branch as $blockData) {
            $b = self::makeStorableBlockDataFromValidInput($blockTypes->{$blockData->type}, $blockData);
            if ($blockData->children)
                $b->children = self::makeStorableBlocksDataFromValidInput($blockData->children, $blockTypes);
            $out[] = $b;
        }
        return $out;
    }
    /**
     * @param object $input
     * @return string[] Error messages or []
     */
    private static function validateRenderBlockInput(object $input): array {
        return Validation::makeObjectValidator()
            ->rule("block.type", "type", "string")
            ->validate($input);
    }
}
