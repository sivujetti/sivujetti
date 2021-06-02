<?php declare(strict_types=1);

namespace KuuraCms\Block;

use KuuraCms\SharedAPIContext;
use Pike\{Db, PikeException, Request, Response};

final class BlocksController {
    public function createBlock(Request $req, Response $res, SharedAPIContext $storage, Db $db): void {

        // todo validate block-related input

        $blockProps = self::makeBlockProps($req->body,
                                           $storage->getDataHandle()->blockTypes);

        $newBlockId = $db->runInTransaction(function () use ($req, $db, $blockProps) {
            [$qList, $values, $columns] = $db->makeInsertQParts([
                'type' => $req->body->type,
                'section' => $req->body->section,
                'renderer' => $req->body->renderer,
                'pageId' => $req->body->pageId,
            ]);
            if ($db->exec("INSERT INTO `blocks` ({$columns}) VALUES ({$qList})",
                          $values) !== 1)
                throw new PikeException('hj');

            //
            $insertId = $db->lastInsertId();
            foreach ($blockProps as $prop)
                $prop->blockId = $insertId;

            [$qGroups, $values, $columns] = $db->makeBatchInsertQParts($blockProps);
            return $db->exec("INSERT INTO `blockProps` ({$columns}) VALUES {$qGroups}",
                             $values) > 0 ? $db->lastInsertId() : null;

        });

        $res->json(['insertId' => $newBlockId]);
    }
    public function updateBlock(): void {
        // todo
    }
    private static function makeBlockProps(object $reqBody, array $blockTypes): array {
        $t = $blockTypes[$reqBody->type] ?? null;
        if (!$t)
            throw new PikeException('');

        //
        $propDescriptors = $t()->defineProperties();
        $blockProps = [];
        foreach ($propDescriptors as $d)
            // todo validate using $d (if $d->dataType == 'string' && !is_string($reqBody->{$d->name})) etc..)
            $blockProps[$d->name] = (object) [
                'key' => $d->name,
                'value' => $reqBody->{$d->name},
                'blockId' => 'see-below'
            ];
        return $blockProps;
    }
}
