<?php declare(strict_types=1);

namespace Sivujetti\Update\Patch;

use Pike\ArrayUtils;
use Pike\Auth\Crypto;
use Pike\Db\FluentDb;
use Pike\Interfaces\FileSystemInterface;
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
                " SELECT `name`,`lang`,`country`,`description`,`aclRules`,`firstRuns`,`versionId`,`lastUpdatedAt`,`newestCoreVersionLastChecked`," .
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
}
