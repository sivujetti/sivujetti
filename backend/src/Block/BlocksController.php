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
                             $values) > 0 ? $insertId : null;

        });

        $res->json(['insertId' => $newBlockId]);
    }
    public function updateBlock(Request $req, Response $res, SharedAPIContext $storage, Db $db): void {
        // todo validate block-related input

        // todo change type change

        $blockProps = self::makeBlockProps($req->body,
                                           $storage->getDataHandle()->blockTypes);

        $ok = $db->runInTransaction(function () use ($req, $db, $blockProps) {

            [$columns, $values] = $db->makeUpdateQParts([
                'type' => $req->body->type,
                'section' => $req->body->section,
                'renderer' => $req->body->renderer,
            ]);
            //
            if ($db->exec("UPDATE `blocks` SET {$columns} WHERE `id` = ?",
                          array_merge($values, [$req->params->blockId])) !== 1)
                throw new PikeException('hj');

            $db->exec("DELETE FROM `blockProps` WHERE `blockId` = ?",
                      [$req->params->blockId]);

            //
            foreach ($blockProps as $prop)
                $prop->blockId = $req->params->blockId;

            [$qGroups, $values, $columns] = $db->makeBatchInsertQParts($blockProps);
            return $db->exec("INSERT INTO `blockProps` ({$columns}) VALUES {$qGroups}",
                             $values) > 0 ? true : false;

        });

        $res->json(['ok' => $ok]);
    }
    public function tempCreateService(Request $req, Response $res, Db $db): void {
        [$qList, $values, $columns] = $db->makeInsertQParts([
            'title' => '<pseudo>',
            'slug' => '',
            'template' => '',
        ]);
        if ($db->exec("INSERT INTO `pages` ({$columns}) VALUES ({$qList})",
                      $values) !== 1)
            throw new PikeException('foo');
        $pageId = $db->lastInsertId();

        foreach ([
            [
                (object) ['type' => 'heading', 'section' => 'main',
                          'renderer' => 'auto', 'pageId' => $pageId],
                [(object) ['key' => 'text', 'value' => 'Service 3', 'blockId' => 'see below'],
                 (object) ['key' => 'level', 'value' => '2', 'blockId' => 'see below']]
            ],
            [
                (object) ['type' => 'paragraph', 'section' => 'main',
                          'renderer' => 'auto', 'pageId' => $pageId],
                [(object) ['key' => 'text', 'value' => 'Catdogs', 'blockId' => 'see below']]
            ],
        ] as [$blockData, $blockProps]) {

            [$qList, $values, $columns] = $db->makeInsertQParts($blockData);
            if ($db->exec("INSERT INTO `blocks` ({$columns}) VALUES ({$qList})",
                          $values) !== 1)
                throw new PikeException('foo');
            $blockId = $db->lastInsertId();

            foreach ($blockProps as $prop)
                $prop->blockId = $blockId;
            [$qGroups, $values, $columns] = $db->makeBatchInsertQParts($blockProps);
            $db->exec("INSERT INTO `blockProps` ({$columns}) VALUES {$qGroups}",
                      $values);
        }

        $res->json(['ok' => true]);
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
