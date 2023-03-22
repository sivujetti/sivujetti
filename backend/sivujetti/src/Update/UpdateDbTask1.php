<?php declare(strict_types=1);

namespace Sivujetti\Update;

use Pike\Db\FluentDb;
use Sivujetti\Block\BlockTree;
use Sivujetti\JsonUtils;
use Sivujetti\Page\PagesRepository2;

final class UpdateDbTask1 implements UpdateProcessTaskInterface {
    /**
     */
    function __construct(private PagesRepository2 $pagesRepo, private FluentDb $db) {

    }
    /**
     * 
     */
    public function exec(): void {
        $pages = $this->db->select("Pages", "stdClass")->fields(["blocks as blocksJson", "id"])->fetchAll();
        $gbts = $this->db->select("globalBlockTrees", "stdClass")->fields(["blocks as blocksJson", "id"])->fetchAll();
        $reusables = $this->db->select("reusableBranches", "stdClass")->fields(["blockBlueprints as blockBlueprintsJson", "id"])->fetchAll();
        $this->db->getDb()->runInTransaction(function () use ($pages, $gbts, $reusables) {
            $this->patchPagesOrGbts($gbts, "globalBlockTrees");
            $this->patchPagesOrGbts($pages, "Pages");
            $this->patchReusables($reusables);
        });
    }
    /**
     * 
     */
    public function rollBack(): void {

    }
    /**
     * 
     */
    private function patchPagesOrGbts(array $entities, string $tableName): void {
        foreach ($entities as $entitity) {
            $bef = $entitity->blocksJson;
            $tree = JsonUtils::parse($bef);
            BlockTree::traverse($tree, function ($itm) {
                if ($itm->type === "Image" && !property_exists($itm, "altText"))
                    $itm->propsData[] = (object) ["key" => "altText", "value" => ""];
            });
            $entitity->blocksJson = JsonUtils::stringify($tree);
            if ($entitity->blocksJson !== $bef) {
                $numRows = $this->db->update($tableName)
                    ->values((object)["blocks" => $entitity->blocksJson])
                    ->where("id=?",[$entitity->id])
                    ->execute();
                var_dump("updated {$tableName} `{$entitity->id}`: {$numRows} rows changed");
            }
        }
    }
    /**
     * 
     */
    private function patchReusables(array $reusables): void {
        foreach ($reusables as $reusable) {
            $bef = $reusable->blockBlueprintsJson;
            $tree = JsonUtils::parse($bef);
            self::traverseReusables($tree, function ($itm) {
                if ($itm->blockType === "Image" && !property_exists($itm->initialOwnData, "altText"))
                    $itm->initialOwnData->altText = "";
            });
            $reusable->blockBlueprintsJson = JsonUtils::stringify($tree);
            if ($reusable->blockBlueprintsJson !== $bef) {
                $numRows = $this->db->update("reusableBranches")
                    ->values((object)["blockBlueprints" => $reusable->blockBlueprintsJson])
                    ->where("id=?",[$reusable->id])
                    ->execute();
                var_dump("updated reusable `{$reusable->id}`: {$numRows} rows changed");
            }
        }
    }
    /**
     * 
     */
    private static function traverseReusables(array $reusables, \Closure $fn): void {
        foreach ($reusables as $reusable) {
            $fn($reusable);
            if ($reusable->initialChildren) self::traverseReusables($reusable->initialChildren, $fn);
        }
    }
}
