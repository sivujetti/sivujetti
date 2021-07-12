<?php declare(strict_types=1);

namespace KuuraCms\Block;

use KuuraCms\BlockType\BlockTypeInterface;
use KuuraCms\Page\PagesRepository;
use KuuraCms\PageType\Entities\PageType;
use KuuraCms\SharedAPIContext;
use Pike\{PikeException, Request, Response, Validation};

final class BlocksController {
    /**
     * Inserts a new block to the database and links it to $req->body->pageId.
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
        if (($errors = self::validateAddBlockToPageInput($req->body))) {
            $res->status(400)->json($errors);
            return;
        }
        if (!($blockType = $storage->getDataHandle()->blockTypes->{$req->body->type} ?? null))
            throw new PikeException("Unknown block type `{$req->body->type}`.",
                                    PikeException::BAD_INPUT);
        if (!($page = $pagesRepo->getSingle(PageType::PAGE)
            ->where('${t}.`id`=?', $req->body->pageId)
            ->exec()))
            throw new PikeException("Couldn't not add block to page #{$req->body->pageId}" .
                " because it doesn't exist.", PikeException::BAD_INPUT);
        if ($req->body->parentBlockId) {
            throw new \RuntimeException("Not implemented yet.");
        } else {
            $page->blocks[] = self::makeStorableBlockDataFromInput($req->body, $blockType);
        }
        if (($num = $pagesRepo->updateById($req->body->pageId, $page)) !== 1)
            throw new PikeException("Expected \$numAffectedRows to equal 1 but got $num",
                PikeException::INEFFECTUAL_DB_OP);
        $res->json(["ok" => "ok"]);
    }
    /**
     * @param object $input
     * @return \KuuraCms\BlockType\BlockTypeInterface $blockType
     * @return object
     */
    private static function makeStorableBlockDataFromInput(object $input,
                                                           BlockTypeInterface $blockType): object {
        $out = (object) [
            "type" => $input->type,
            "title" => $input->title,
            "renderer" => $input->renderer,
            "id" => $input->id,
            "children" => [],
            "props" => [],
        ];
        foreach ($blockType->defineProperties() as $prop) {
            if (!property_exists($input, $prop->name)) throw new \RuntimeException("Todo");
            $out->props[] = (object) ["key" => $prop->name, "value" => $input->{$prop->name}];
        }
        return $out;
    }
    /**
     * @param object $input
     * @return string[] Error messages or []
     */
    private static function validateAddBlockToPageInput(object $input): array {
        return Validation::makeObjectValidator()
            ->rule("type", "type", "string")
            ->rule("title", "type", "string")
            ->rule("renderer", "in", ["kuura:auto", "kuura:generic-wrapper"])
            ->rule("id", "minLength", 20)
            ->rule("id", "maxLength", 20)
            ->rule("parentBlockId", "type", "string")
            ->validate($input);
    }
}
