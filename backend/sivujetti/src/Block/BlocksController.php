<?php declare(strict_types=1);

namespace Sivujetti\Block;

use Pike\{Request, Response, Validation};
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\{BlockTypeInterface, PropertiesBuilder};
use Sivujetti\Page\{PagesController, PagesRepository, SiteAwareTemplate};
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
     * @param \Sivujetti\SharedAPIContext $storage
     */
    public function render(Request $req,
                           Response $res,
                           BlockValidator $blockValidator,
                           TheWebsite $theWebsite,
                           PagesRepository $pagesRepo,
                           SharedAPIContext $storage): void {
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
        PagesController::runBlockBeforeRenderEvent([$block], $storage->getDataHandle()->blockTypes,
                                                   $pagesRepo, $theWebsite);
        $html = (new SiteAwareTemplate($block->renderer, null, [
            "page" => null,
            "site" => $theWebsite,
        ]))->renderBlocks([$block]);
        $res->json(["result" => $html]);
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
        ];
        foreach ($blockType->defineProperties(new PropertiesBuilder) as $prop)
            $out->propsData[] = (object) ["key" => $prop->name, "value" => $input->{$prop->name}];
        return $out;
    }
    /**
     * @param object[] $branch
     * @return object $blockTypes
     * @return object
     */
    public static function makeStorableBlocksDataFromValidInput(array $branch,
                                                                object $blockTypes): array {
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
            ->rule("block.renderer", "type", "string")
            ->validate($input);
    }
}
