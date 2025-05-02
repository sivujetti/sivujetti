<?php declare(strict_types=1);

namespace Sivujetti\Update\Patch;

use Pike\{ArrayUtils, Db};
use Pike\Auth\Crypto;
use Pike\Db\FluentDb2;
use Sivujetti\Block\BlockTree;
use Sivujetti\JsonUtils;
use Sivujetti\Update\UpdateProcessTaskInterface;

/**
 * @phpstan-import-type BlockBlueprint from \Sivujetti\Block\Entities\Block
 * @phpstan-type ReusableBranch object{initialChildren: list<ReusableBranch>} & \stdClass
 */
final class PatchDbTask3 implements UpdateProcessTaskInterface {
    /** @var bool */
    private bool $doSkip;
    /** @var \Pike\Db\FluentDb2 */
    private FluentDb2 $db;
    /** @var \Pike\Auth\Crypto */
    private Crypto $crypto;
    /** @var \Closure */
    private \Closure $logFn;
    /**
     * @param string $toVersion
     * @param string $currentVersion
     * @param \Pike\Db\FluentDb2 $db
     * @param \Pike\Auth\Crypto $crypto
     */
    function __construct(string $toVersion,
                         string $currentVersion,
                         FluentDb2 $db,
                         Crypto $crypto) {
        $this->doSkip = !($toVersion === "0.17.0" && $currentVersion === "0.16.0");
        $this->db = $db;
        $this->crypto = $crypto;
        $this->logFn = function ($str) { var_dump($str); };
    }
    /**
     */
    public function exec(): void {
        if ($this->doSkip) return;

        $this->patchTheWebsite();
        $db = $this->db->getDb();
        $driver = $db->attr(\PDO::ATTR_DRIVER_NAME);
        $statements = require SIVUJETTI_BACKEND_PATH . "installer/schema.{$driver}.php";
        $this->migrateThemesTable($db, $statements);

        $pages = $this->db->select("\${p}Pages")->fields(["blocks as blocksJson", "id"])->fetchAll(\PDO::FETCH_OBJ);
        $gbts = $this->db->select("\${p}globalBlockTrees")->fields(["blocks as blocksJson", "id"])->fetchAll(\PDO::FETCH_OBJ);
        $reusables = $this->db->select("\${p}reusableBranches")->fields(["blockBlueprints as blockBlueprintsJson", "id"])->fetchAll(\PDO::FETCH_OBJ);
        $pageTypes = $this->db->select("\${p}pageTypes")->fields(["fields as fieldsJson", "id"])->fetchAll(\PDO::FETCH_OBJ);
        $this->patchPagesOrGbts($pages, "Pages");
        $this->patchPagesOrGbts($gbts, "globalBlockTrees");
        $this->patchReusables($reusables);
        $this->patchPageTypes($pageTypes);
    }
    /**
     */
    public function rollBack(): void {
        // Can't rollBack
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
     * @param \Pike\Db $db
     * @param list<string> $schemaStatements
     */
    private function migrateThemesTable(Db $db, array $schemaStatements): void {
        $this->migrateTable($db, $schemaStatements, [
            [
                "name" => "themes",
                "fieldsFrom" => "`id`,`name`,`styleChunkBundlesAll`,`cachedCompiledScreenSizesCssHashes`," .
                                "'[]' AS `miscWysiwygStyles`,`isActive`,`generatedScopedStylesCss`,`stylesLastUpdatedAt`",
                "fieldsInto" => "`id`,`name`,`styleChunkBundlesAll`,`cachedCompiledCssHash`," .
                                "`miscWysiwygStyles`,`isActive`,`generatedScopedStylesCss`,`stylesLastUpdatedAt`",
            ],
            [
                "name" => "themeStyles",
                "foreignTable" => "themes",
                // No change
                "fieldsFrom" => "`units`,`themeId`,`blockTypeName`",
                "fieldsInto" => "`units`,`themeId`,`blockTypeName`",
            ],
            [
                "name" => "pageThemeStyles",
                "foreignTable" => "themes",
                // No change
                "fieldsFrom" => "`chunks`,`pageId`,`pageType`,`themeId`",
                "fieldsInto" => "`chunks`,`pageId`,`pageType`,`themeId`",
            ],
        ]);
    }
    /**
     * @param list<object{id: string, blocksJson: string}> $entities
     * @param string $tableName
     */
    private function patchPagesOrGbts(array $entities, string $tableName): void {
        foreach ($entities as $entity) {
            $maybePatched = JsonUtils::parse($entity->blocksJson);
            $numChanges = 0;
            BlockTree::traverse($maybePatched, function ($itm) use (&$numChanges) {
                // #1: Columns
                if ($itm->type === "Columns" && ArrayUtils::findIndexByKey($itm->propsData, "isRow", "key") < 0) {
                    $numColsProp = ArrayUtils::findByKey($itm->propsData, "numColumns", "key");
                    $takeFullWidthProp = ArrayUtils::findByKey($itm->propsData, "takeFullWidth", "key");
                    $itm->propsData = [
                        (object) ["key" => "isRow", "value" => 0],
                        (object) ["key" => "numColumns", "value" => $numColsProp?->value ?? null],
                        (object) ["key" => "config", "value" => (object) [
                            ...($takeFullWidthProp ? ["takeFullWidth" => $takeFullWidthProp->value] : []),
                        ]],
                    ];
                    $numChanges += 1;
                }
            });
            if ($numChanges) {
                $numRows = $this->db->update("\${p}{$tableName}")
                    ->values((object)["blocks" => JsonUtils::stringify($maybePatched)])
                    ->where("id = ?", [$entity->id])
                    ->execute();
                $this->logFn->__invoke("Updated {$tableName} `{$entity->id}`: {$numRows} rows changed");
            }
        }
    }
    /**
     * @param list<object{id: string, blockBlueprintsJson: string}> $reusables
     * @param string $tableName
     */
    private function patchReusables(array $reusables): void {
        foreach ($reusables as $reusable) {
            $maybePatched = JsonUtils::parse($reusable->blockBlueprintsJson);
            $numChanges = 0;
            self::traverseBlockBlueprintLike($maybePatched, function ($itm) use (&$numChanges) {
                // #1: Columns
                if ($itm->blockType === "Columns" && !property_exists($itm->initialOwnData, "isRow")) {
                    $takeFullWidth = $itm->initialOwnData->takeFullWidth ?? null;
                    $itm->initialOwnData = (object) [
                        "isRow" => 0,
                        "numColumns" => $itm->initialOwnData->numColumns ?? null,
                        "config" => (object) [
                            ...(is_int($takeFullWidth) ? ["takeFullWidth" => $takeFullWidth] : []),
                        ],
                    ];
                    $numChanges += 1;
                }
            });
            if ($numChanges) {
                $numRows = $this->db->update("\${p}reusableBranches")
                    ->values((object)["blockBlueprints" => JsonUtils::stringify($maybePatched)])
                    ->where("id = ?", [$reusable->id])
                    ->execute();
                $this->logFn->__invoke("Updated reusable `{$reusable->id}`: {$numRows} rows changed");
            }
        }
    }
    /**
     * @param list<object{id: string, fieldsJson: string}> $pageTypes
     * @param string $tableName
     */
    private function patchPageTypes(array $pageTypes): void {
        foreach ($pageTypes as $pageType) {
            $maybePatched = JsonUtils::parse($pageType->fieldsJson);
            $numChanges = 0;
            self::traverseBlockBlueprintLike($maybePatched->blockBlueprintFields, function ($itm) use (&$numChanges) {
                // #1: Columns
                if ($itm->blockType === "Columns" && !property_exists($itm->initialData, "isRow")) {
                    $takeFullWidth = $itm->initialData->takeFullWidth ?? null;
                    $itm->initialData = (object) [ // Mutates $obj->blockBlueprintFields[*]
                        "isRow" => 0,
                        "numColumns" => $itm->initialData->numColumns ?? null,
                        "config" => (object) [
                            ...(is_int($takeFullWidth) ? ["takeFullWidth" => $takeFullWidth] : []),
                        ],
                    ];
                    $numChanges += 1;
                }
            });
            if ($numChanges) {
                $numRows = $this->db->update("\${p}pageTypes")
                    ->values((object)["fields" => JsonUtils::stringify($maybePatched)])
                    ->where("id = ?", [$pageType->id])
                    ->execute();
                $this->logFn->__invoke("Updated pageTypes `{$pageType->id}`: {$numRows} rows changed");
            }
        }
    }
    /**
     * @param \Pike\Db $db
     * @param list<string> $schemaStatements
     * @param list<array{name: string, fieldsFrom: string, foreignTable?: string}> $tables
     */
    private function migrateTable(Db $db,
                                  array $schemaStatements,
                                  array $tables): void {
        $tNames = array_map(fn(array $def) => [
            "treal" => "\${p}{$def["name"]}",     // Example: "themes"
            "ttemp" => "\${p}{$def["name"]}_new", // Example: "themes_new"
        ], $tables);

        // 1. [CREATE TABLE {table1}_new, CREATE TABLE {table2}_new, ...]
        foreach ($tables as $i => $def) {
            ["treal" => $treal, "ttemp" => $ttemp] = $tNames[$i];

            // "CREATE TABLE `${p}themes` (...)"
            $create = ArrayUtils::find($schemaStatements, fn($stmt) => str_starts_with($stmt, "CREATE TABLE `{$treal}`"));
            // "CREATE TABLE `${p}themes` (..." -> "TABLE `${p}themes_new` (..."
            $create = str_replace("CREATE TABLE `{$treal}`", "CREATE TABLE `{$ttemp}`", $create);
            // "... REFERENCES `${p}themes`" -> "... REFERENCES `${p}themes_new`"
            if (($tforeign = $def["foreignTable"] ?? null))
                $create = str_replace("REFERENCES `\${p}{$tforeign}`", "REFERENCES `\${p}{$tforeign}_new`", $create);

            foreach ([
                $create,
                "INSERT INTO {$ttemp} ({$def["fieldsInto"]}) " .
                "SELECT {$def["fieldsFrom"]} FROM {$treal}",
            ] as $stmt) {
                $db->exec($stmt);
            }
        }

        // 2. [DROP TABLE {table2}, DROP TABLE {table1}, ...]
        foreach (array_reverse($tNames) as $tn) {
            $db->exec("DROP TABLE {$tn["treal"]}");
        }

        // 3. [RENAME {table2}_new -> {table2}, RENAME {table1}_new -> {table1}, ...]
        foreach (array_reverse($tNames) as $tn) {
            $db->exec("ALTER TABLE {$tn["ttemp"]} RENAME TO {$tn["treal"]}");
        }
    }
    /**
     * @param list<BlockBlueprint|ReusableBranch> $entities
     * @param \Closure $fn
     */
    private static function traverseBlockBlueprintLike(array $entities, \Closure $fn): void {
        foreach ($entities as $reusable) {
            $fn($reusable);
            if ($reusable->initialChildren) self::traverseBlockBlueprintLike($reusable->initialChildren, $fn);
        }
    }
}
