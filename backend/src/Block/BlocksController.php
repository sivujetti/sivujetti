<?php declare(strict_types=1);

namespace KuuraCms\Block;

use KuuraCms\AssociativeJoinStorageStrategy;
use KuuraCms\SharedAPIContext;
use Pike\{ArrayUtils, Db, PikeException, Request, Response};

final class BlocksController {
    public function __construct() {
        if (STORAGE_STATEGY !== 'embedded')
            throw new \RuntimeException('');
    }
    public function createBlock(Request $req, Response $res, SharedAPIContext $storage, Db $db): void {

        // todo validate block-related input

        $blockTree = self::fetchBlockTreeFromDb($db, $req);

        $blockProps = self::makeBlockProps($req->body,
                                           $storage->getDataHandle()->blockTypes);

        $updatedTree = $blockTree->insertItem((object) [
            'id' => $req->body->id,
            'parentPath' => $req->body->path,
            'type' => $req->body->type,
            'section' => $req->body->section,
            'renderer' => $req->body->renderer,
            'pageId' => $req->body->pageId,
            'title' => null,
            'props' => array_values($blockProps),
            'children' => [],
        ]);

        $newBlockId = $db->exec("UPDATE `pages` SET `blocks` = ? WHERE `id` = ?",
                                [$updatedTree, $req->body->pageId]) > 0 ? $req->body->id : null;

        $res->json(['ok' => $newBlockId !== null ? 'ok' : 'err',
                    'insertId' => $newBlockId]);
    }
    public function updateBlock(Request $req, Response $res, SharedAPIContext $storage, Db $db): void {
        // todo validate block-related input

        // todo handle type change

        $blockTree = self::fetchBlockTreeFromDb($db, $req);

        $blockProps = self::makeBlockProps($req->body,
                                           $storage->getDataHandle()->blockTypes);

        $updatedTree = $blockTree->updateItem((object) [
            'id' => $req->body->id,
            'parentPath' => AssociativeJoinStorageStrategy::makeParentPath($req->body->path),
            'type' => $req->body->type,
            'section' => $req->body->section,
            'renderer' => $req->body->renderer,
            'pageId' => $req->body->pageId,
            'title' => $req->body->title,
            'props' => array_values($blockProps),
            'children' => $req->body->children,
        ], $req->body->id);

        $ok = $db->exec("UPDATE `pages` SET `blocks` = ? WHERE `id` = ?",
                        [$updatedTree, $req->body->pageId]) > 0;

        $res->json(['ok' => $ok]);
    }
    private static function fetchBlockTreeFromDb(Db $db, Request $req): BlockTree {
        $row = $db->fetchOne('SELECT `blocks` FROM `pages` WHERE `id` = ?',
                             [$req->body->pageId], \PDO::FETCH_ASSOC);
        if (!$row) throw new PikeException('No such page');
        return BlockTree::fromJson($row['blocks']);
    }
    private static function makeBlockProps(object $reqBody, array $blockTypes): array {
        $t = $blockTypes[$reqBody->type] ?? null;
        if (!$t)
            throw new PikeException('');

        //
        $propDescriptors = $t()->defineProperties();
        if (!count($propDescriptors)) throw new \RuntimeException('?');

        $blockProps = [];
        foreach ($propDescriptors as $d)
            // todo validate using $d (if $d->dataType == 'string' && !is_string($reqBody->{$d->name})) etc..)
            $blockProps[$d->name] = (object) [
                'key' => $d->name,
                'value' => $reqBody->{$d->name},
                'id' => $reqBody->{"_propId_{$d->name}"},
                'blockId' => $reqBody->id,
            ];
        return $blockProps;
    }
}

final class BlockTree {
    private array $tree;
    public function __construct(array $blockTree) {
        $this->tree = $blockTree;
    }
    public function insertItem(object $data): string {
        $parent = $this->find(explode('/', substr($data->parentPath,0,strlen($data->parentPath)-1)), $this->tree);
        $parent->children[] = $data;
        return $this->getTreeAsJson();
    }
    public function find(array $path, array $branch, int $n = 0): ?object {
        foreach ($branch as $block) {
            if ($block->id !== $path[$n]) continue;
            if (count($path) > $n + 1) {
                if (!$block->children) return null;
                return $this->find($path, $block->children, $n + 1);
            }
            return $block;
        }
        return null;
    }
    public function updateItem(object $data, string $blockId): string {
        $parent = $this->find(explode('/', substr($data->parentPath,0,strlen($data->parentPath)-1)), $this->tree);
        $idx = ArrayUtils::findIndexByKey($parent->children, $blockId, 'id');
        $parent->children[$idx] = $data;
        return $this->getTreeAsJson();
    }
    public function deleteItem(object $newData, string $blockId): string {
        throw new \RuntimeException('');
        return $this->getTreeAsJson();
    }
    private function getTreeAsJson(): string {
        return json_encode($this->tree, JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
    }
    public static function fromJson(string $json): BlockTree {
        return new self(json_decode($json, flags: JSON_THROW_ON_ERROR));
    }
}
