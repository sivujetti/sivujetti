<?php declare(strict_types=1);

namespace Sivujetti\Update\Patch;

use Pike\ArrayUtils;
use Pike\Auth\Crypto;
use Pike\Db\FluentDb;
use Sivujetti\Block\BlockTree;
use Sivujetti\JsonUtils;
use Sivujetti\Update\UpdateProcessTaskInterface;

final class PatchDbTask1 implements UpdateProcessTaskInterface {
    /** @var bool */
    private bool $doSkip;
    /** @var \Pike\Db\FluentDb */
    private FluentDb $db;
    /** @var \Pike\Auth\Crypto */
    private Crypto $crypto;
    /** @var \Closure */
    private \Closure $logFn;
    /**
     * @param string $toVersion
     * @param string $currentVersion
     * @param \Pike\Db\FluentDb $db
     * @param \Pike\Auth\Crypto $crypto
     */
    function __construct(string $toVersion, string $currentVersion, FluentDb $db, Crypto $crypto) {
        $this->doSkip = !($toVersion === "0.14.0" && $currentVersion === "0.13.0");
        $this->db = $db;
        $this->crypto = $crypto;
        $this->logFn = function ($str) { /**/ };
    }
    /**
     * 
     */
    public function exec(): void {
        if ($this->doSkip) return;

        $this->migrateTheWebsiteTable();

        $pages = $this->db->select("\${p}Pages", "stdClass")->fields(["blocks as blocksJson", "id"])->fetchAll();
        $gbts = $this->db->select("\${p}globalBlockTrees", "stdClass")->fields(["blocks as blocksJson", "id"])->fetchAll();
        $reusables = $this->db->select("\${p}reusableBranches", "stdClass")->fields(["blockBlueprints as blockBlueprintsJson", "id"])->fetchAll();
        $this->patchPagesOrGbts($gbts, "globalBlockTrees");
        $this->patchPagesOrGbts($pages, "Pages");
        $this->patchReusables($reusables);

        $this->db->insert("\${p}jobs")->values((object) [
            "id" => 2,
            "jobName" => "update-plugin",
            "startedAt" => 0,
        ])->execute();

        $this->patchThemeStyles();

        $this->updateVersionId();
    }
    /**
     * 
     */
    public function rollBack(): void {
        // Can't rollBack
    }
    /**
     * 
     */
    private function migrateTheWebsiteTable(): void {
        $db = $this->db->getDb();
        $driver = $db->attr(\PDO::ATTR_DRIVER_NAME);
        $statements = require SIVUJETTI_BACKEND_PATH . "installer/schema.{$driver}.php";
        //
        $newt = "\${p}theWebsite_new";
        $orig = "\${p}theWebsite";
        foreach ([
            // 1. create table $new
            str_replace($orig, $newt,
                ArrayUtils::find($statements, fn($stmt) => str_starts_with($stmt, "CREATE TABLE `{$orig}`"))
            ),
            // 2. insert into $new from $orig
            "INSERT INTO {$newt} (`name`,`lang`,`country`,`description`," . // hideFromSearchEngines = use default
                " `aclRules`,`firstRuns`,`versionId`,`lastUpdatedAt`,`newestCoreVersionLastChecked`)" .
                " SELECT `name`,`lang`,`country`,`description`,`aclRules`,`firstRuns`,`versionId`,`lastUpdatedAt`,`newestCoreVersionLastChecked`" .
                " FROM {$orig}",
            // 3. drop $orig
            "DROP TABLE {$orig}",
            // 4. rename $new -> $orig
            "ALTER TABLE {$newt} RENAME TO {$orig}",
        ] as $stmt) {
            $db->exec($stmt);
        }
    }
    /**
     *
     */
    private function patchPagesOrGbts(array $entities, string $tableName): void {
        foreach ($entities as $entity) {
            $bef = $entity->blocksJson;
            $tree = JsonUtils::parse($bef);
            BlockTree::traverse($tree, function ($itm) {
                if ($itm->type === "Image" && ArrayUtils::findIndexByKey($itm->propsData, "altText", "key") < 0)
                    $itm->propsData[] = (object) ["key" => "altText", "value" => ""];
            });
            $entity->blocksJson = JsonUtils::stringify($tree);
            if ($entity->blocksJson !== $bef) {
                $numRows = $this->db->update("\${p}{$tableName}")
                    ->values((object)["blocks" => $entity->blocksJson])
                    ->where("id=?", [$entity->id])
                    ->execute();
                $this->logFn->__invoke("updated {$tableName} `{$entity->id}`: {$numRows} rows changed");
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
                $numRows = $this->db->update("\${p}reusableBranches")
                    ->values((object)["blockBlueprints" => $reusable->blockBlueprintsJson])
                    ->where("id=?", [$reusable->id])
                    ->execute();
                $this->logFn->__invoke("updated reusable `{$reusable->id}`: {$numRows} rows changed");
            }
        }
    }
    /**
     *
     */
    private function patchThemeStyles(): void {
        $styles = $this->db->select("\${p}themeStyles", "stdClass")
            ->fields(["units as unitsJson", "themeId", "blockTypeName"])->fetchAll();
        //
        foreach ($styles as $style) {
            $bef = $style->unitsJson;
            $patched = JsonUtils::parse($bef);
            foreach ($patched as $style2) {
                if (!is_string($style2->origin ?? null))
                    $style2->origin = ""; // Note: mutates $patched
                if (!is_string($style2->specifier ?? null))
                    $style2->specifier = ""; // Note: mutates $patched
            }
            $style->unitsJson = JsonUtils::stringify($patched);
            if ($style->unitsJson !== $bef) {
                $numRows = $this->db->update("\${p}themeStyles")
                    ->values((object)["units" => $style->unitsJson])
                    ->where("themeId=? AND blockTypeName=?", [$style->themeId, $style->blockTypeName])
                    ->execute();
                $this->logFn->__invoke("updated themeStyles `{$style->themeId}:{$style->blockTypeName}`: {$numRows} rows changed");
            }
        }
    }
    /**
     *
     */
    private function updateVersionId(): void {
        $this->db->update("\${p}theWebsite")
            ->values((object)["versionId" => $this->crypto->genRandomToken(4)])
            ->where("1=1")
            ->execute();
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
