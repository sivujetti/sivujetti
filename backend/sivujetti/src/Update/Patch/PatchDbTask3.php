<?php declare(strict_types=1);

namespace Sivujetti\Update\Patch;

use Pike\{ArrayUtils, Db};
use Pike\Auth\Crypto;
use Pike\Db\FluentDb2;
use Sivujetti\JsonUtils;
use Sivujetti\Update\UpdateProcessTaskInterface;

final class PatchDbTask3 implements UpdateProcessTaskInterface {
    /** @var bool */
    private bool $doSkip;
    /** @var \Pike\Db\FluentDb2 */
    private FluentDb2 $db;
    /** @var \Pike\Auth\Crypto */
    private Crypto $crypto;
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
}
