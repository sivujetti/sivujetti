<?php declare(strict_types=1);

namespace Sivujetti\Update\Patch;

use Pike\ArrayUtils;
use Pike\Auth\Crypto;
use Pike\Db\FluentDb;
use Pike\Interfaces\FileSystemInterface;
use Sivujetti\Block\BlockTree;
use Sivujetti\JsonUtils;
use Sivujetti\Update\UpdateProcessTaskInterface;

final class PatchDbTask3 implements UpdateProcessTaskInterface {
    /** @var bool */
    private bool $doSkip;
    /** @var \Pike\Db\FluentDb */
    private FluentDb $db;
    /** @var \Pike\Auth\Crypto */
    private Crypto $crypto;
    /** @var \Pike\Interfaces\FileSystemInterface */
    private FileSystemInterface $fs;
    /** @var \Closure */
    private \Closure $logFn;
    /**
     * @param string $toVersion
     * @param string $currentVersion
     * @param \Pike\Db\FluentDb $db
     * @param \Pike\Auth\Crypto $crypto
     * @param \Pike\Interfaces\FileSystemInterface $fs
     */
    function __construct(string $toVersion,
                         string $currentVersion,
                         FluentDb $db,
                         Crypto $crypto,
                         FileSystemInterface $fs) {
        $this->doSkip = !($toVersion === "0.16.0" && $currentVersion === "0.15.0");
        $this->db = $db;
        $this->crypto = $crypto;
        $this->fs = $fs;
        $this->logFn = function ($str) { /**/ };
    }
    /**
     */
    public function exec(): void {
        if ($this->doSkip) return;

        $this->patchConfigFile();
        $this->migrateTheWebsiteTable();

        $pages = $this->db->select("\${p}Pages", "stdClass")->fields(["blocks as blocksJson", "id"])->fetchAll();
        $gbts = $this->db->select("\${p}globalBlockTrees", "stdClass")->fields(["blocks as blocksJson", "id"])->fetchAll();
        $reusables = $this->db->select("\${p}reusableBranches", "stdClass")->fields(["blockBlueprints as blockBlueprintsJson", "id"])->fetchAll();
        $pageTypes = $this->db->select("\${p}pageTypes", "stdClass")->fields(["fields as fieldsJson", "id"])->fetchAll();
        $this->patchPagesOrGbts($gbts, "globalBlockTrees");
        $this->patchPagesOrGbts($pages, "Pages");
        $this->patchReusables($reusables);
        $this->patchPageTypes($pageTypes);

        $this->patchTheWebsite();

        $this->db->insert("\${p}jobs")->values((object) [
            "id" => 3,
            "jobName" => "updates:all",
            "startedAt" => 0,
        ])->execute();
    }
    /**
     */
    public function rollBack(): void {
        // Can't rollBack
    }
    /**
     */
    private function patchConfigFile(): void {
        $filePath = SIVUJETTI_INDEX_PATH . "config.php";
        $php = $this->fs->read($filePath);
        if (!$php) {
            $this->logFn->__invoke("failed to read config.php");
            return;
        }
        if (!str_contains($php, "SIVUJETTI_UPDATE_KEY")) {
            $status = $this->fs->write($filePath, preg_replace(
                "/define\('SIVUJETTI_SECRET[^\n]+\n/",
                "\$0    define('SIVUJETTI_UPDATE_KEY', '386b8bfcaf29be2885ef2576877c02c8b68c3274295645a814ea31b75d5bc97c');\r\n",
                $php)) ? "patched" : "failed to patch";
            $this->logFn->__invoke("{$status} index.php");
        } else {
            $this->logFn->__invoke("Seems that config.php already contains define(\"SIVUJETTI_UPDATE_KEY\", ...)");
        }
    }
    /**
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
            "INSERT INTO {$newt} (`name`,`lang`,`country`,`description`,`hideFromSearchEngines`,`aclRules`,`firstRuns`,`versionId`,`lastUpdatedAt`,`latestPackagesLastCheckedAt`,`pendingUpdates`,`headHtml`,`footHtml`)" .
                " SELECT `name`,`lang`,`country`,`description`,`hideFromSearchEngines`,`aclRules`,`firstRuns`,`versionId`,`lastUpdatedAt`,`newestCoreVersionLastChecked`" .
                ",null AS `pendingUpdates`,'' AS `headHtml`,'' AS `footHtml`" .
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
     */
    private function patchPagesOrGbts(array $entities, string $tableName): void {
        foreach ($entities as $entity) {
            $bef = $entity->blocksJson;
            $tree = JsonUtils::parse($bef);
            BlockTree::traverse($tree, function ($itm) {
                if ($itm->type === "Image" && ArrayUtils::findIndexByKey($itm->propsData, "caption", "key") < 0)
                    $itm->propsData[] = (object) ["key" => "caption", "value" => ""];
            });
            $entity->blocksJson = JsonUtils::stringify($tree);
            if ($entity->blocksJson !== $bef) {
                $numRows = $this->db->update("\${p}{$tableName}")
                    ->values((object)["blocks" => $entity->blocksJson])
                    ->where("id = ?", [$entity->id])
                    ->execute();
                $this->logFn->__invoke("updated {$tableName} `{$entity->id}`: {$numRows} rows changed");
            }
        }
    }
    /**
     */
    private function patchReusables(array $reusables): void {
        foreach ($reusables as $reusable) {
            $bef = $reusable->blockBlueprintsJson;
            $tree = JsonUtils::parse($bef);
            self::traverseReusables($tree, function ($itm) {
                if ($itm->blockType === "Image" && !property_exists($itm->initialOwnData, "caption"))
                    $itm->initialOwnData->caption = "";
            });
            $reusable->blockBlueprintsJson = JsonUtils::stringify($tree);
            if ($reusable->blockBlueprintsJson !== $bef) {
                $numRows = $this->db->update("\${p}reusableBranches")
                    ->values((object)["blockBlueprints" => $reusable->blockBlueprintsJson])
                    ->where("id = ?", [$reusable->id])
                    ->execute();
                $this->logFn->__invoke("updated reusable `{$reusable->id}`: {$numRows} rows changed");
            }
        }
    }
    /**
     */
    private function patchPageTypes(array $pageTypes): void {
        foreach ($pageTypes as $pageType) {
            $bef = $pageType->fieldsJson;
            $obj = JsonUtils::parse($bef);
            BlockTree::traverse($obj->blockFields, function ($itm) {
                if ($itm->type === "Image" && !is_string($itm->initialData->caption ?? null))
                    $itm->initialData->caption = ""; // Mutates $obj->blockFields[*]
            });
            $pageType->fieldsJson = JsonUtils::stringify($obj);
            if ($pageType->fieldsJson !== $bef) {
                $numRows = $this->db->update("\${p}pageTypes")
                    ->values((object)["fields" => $pageType->fieldsJson])
                    ->where("id = ?", [$pageType->id])
                    ->execute();
                $this->logFn->__invoke("updated pageTypes `{$pageType->id}`: {$numRows} rows changed");
            }
        }
    }
    /**
     */
    private function patchTheWebsite(): void {
        $fn = require SIVUJETTI_BACKEND_PATH . "installer/default-acl-rules.php";
        $aclRules = $fn();
        $this->db->update("\${p}theWebsite")
            ->values((object) [
                "aclRules" => JsonUtils::stringify($aclRules),
                "versionId" => $this->crypto->genRandomToken(4),
            ])
            ->where("1=1")
            ->execute();
    }
    /**
     */
    private static function traverseReusables(array $reusables, \Closure $fn): void {
        foreach ($reusables as $reusable) {
            $fn($reusable);
            if ($reusable->initialChildren) self::traverseReusables($reusable->initialChildren, $fn);
        }
    }
}
