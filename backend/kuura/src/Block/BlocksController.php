<?php declare(strict_types=1);

namespace KuuraCms\Block;

use KuuraCms\BlockType\BlockTypeInterface;
use KuuraCms\Page\PagesRepository;
use KuuraCms\PageType\Entities\PageType;
use KuuraCms\SharedAPIContext;
use Pike\{PikeException, Request, Response};

final class BlocksController {
    /**
     * Inserts a new block to the database and links it to $req->params->pageId.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \KuuraCms\Page\PagesRepository $pagesRepo
     * @param \KuuraCms\SharedAPIContext $storage
     */
    public function addBlockToPage(Request $req,
                                   Response $res,
                                   PagesRepository $pagesRepo,
                                   SharedAPIContext $storage): void {
        if (!is_string(($typeAsStr = $req->body->type ?? null)))
            throw new PikeException("type must be string",
                                    PikeException::BAD_INPUT);
        if (!($blockType = ($storage->getDataHandle()->blockTypes->{$typeAsStr} ?? null)))
            throw new PikeException("Unknown block type `{$typeAsStr}`.",
                                    PikeException::BAD_INPUT);
        if (($errors = BlockValidator::validateInsertData($blockType, $req->body))) {
            $res->status(400)->json($errors);
            return;
        }
        if (!($page = $pagesRepo->getSingle(PageType::PAGE)
            ->where('${t}.`id`=?', $req->params->pageId)
            ->exec()))
            throw new PikeException("Couldn't add block to page #{$req->params->pageId}" .
                " because it doesn't exist.", PikeException::BAD_INPUT);
        //
        $newBlock = self::makeStorableBlockDataFromValidInput($blockType, $req->body);
        if (!$req->body->parentBlockId)
            $page->blocks[] = $newBlock;
        elseif (($appendTo = BlockTree::findBlock($req->body->parentBlockId, $page->blocks)))
            $appendTo->children[] = $newBlock; // Note: mutates $page->blocks
        else
            throw new PikeException("Couldn't add block because its parent" .
                " #{$req->body->parentBlockId} doesn't exist.", PikeException::BAD_INPUT);
        //
        if (($num = $pagesRepo->updateById($req->params->pageId, $page)) !== 1)
            throw new PikeException("Expected \$numAffectedRows to equal 1 but got $num",
                PikeException::INEFFECTUAL_DB_OP);
        $res->json(["ok" => "ok"]);
    }
    /**
     * @return \KuuraCms\BlockType\BlockTypeInterface $blockType
     * @param object $input
     * @return object
     */
    private static function makeStorableBlockDataFromValidInput(BlockTypeInterface $blockType,
                                                                object $input): object {
        $out = (object) [
            "type" => $input->type,
            "title" => $input->title,
            "renderer" => $input->renderer,
            "id" => $input->id,
            "children" => [],
            "propsData" => [],
        ];
        foreach ($blockType->defineProperties() as $prop)
            $out->propsData[] = (object) ["key" => $prop->name, "value" => $input->{$prop->name}];
        return $out;
    }
}
