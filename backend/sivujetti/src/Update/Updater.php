<?php declare(strict_types=1);

namespace Sivujetti\Update;

use Pike\{ArrayUtils, FileSystem, Injector, PikeException};
use Pike\Db\FluentDb2;
use Sivujetti\{App, AppEnv, JsonUtils, LogUtils};
use Sivujetti\Update\Entities\Job;

/**
 * @psalm-type Package object{name: string, sig: string}
 */
final class Updater {
    public const RESULT_BAD_INPUT           = 111010;
    public const RESULT_ALREADY_IN_PROGRESS = 111011;
    public const RESULT_FAILED              = 111012;
    public const RESULT_DOWNLOAD_FAILED     = 111013;
    public const RESULT_UPDATE_NOT_STARTED  = 111014;
    public const RESULT_VERIFICATION_FAILED = 111015;
    public const RESULT_PRECONDITION_FAILED = 111016;
    public const RESULT_OK                  = 0;
    private const UPDATE_JOB_NAME_DEFAULT = "updates:all";
    /** @var \Pike\Db\FluentDb2 */
    private FluentDb2 $db2;
    /** @var \Pike\FileSystem */
    private FileSystem $fs;
    /** @var \Sivujetti\Update\HttpClientInterface */
    private HttpClientInterface $http;
    /** @var \Sivujetti\Update\Signer */
    private Signer $signer;
    /** @var \Sivujetti\AppEnv */
    private AppEnv $appEnv;
    /** @var string[] ["Some error"] or [] */
    private array $lastErrorDetails;
    /** @var string */
    private string $targetBackendDirPath;
    /** @var string */
    private string $targetIndexDirPath;
    /** @var callable */
    private string $errorLogFn;
    /** @var \Pike\Injector */
    private static Injector $di;
    /**
     * @param \Pike\Db\FluentDb2 $db2
     * @param \Pike\FileSystem $fs
     * @param \Sivujetti\Update\HttpClientInterface $http
     * @param \Sivujetti\Update\Signer $signer
     * @param \Sivujetti\AppEnv $appEnv
     * @param string $targetBackendDirPath = SIVUJETTI_BACKEND_PATH Must end with "/", mainly used by tests
     * @param string $targetIndexDirPath = SIVUJETTI_INDEX_PATH
     * @param string $errorLogFn = "error_log" Mainly for tests
     */
    public function __construct(FluentDb2 $db2,
                                FileSystem $fs,
                                HttpClientInterface $http,
                                Signer $signer,
                                AppEnv $appEnv,
                                string $targetBackendDirPath = SIVUJETTI_BACKEND_PATH,
                                string $targetIndexDirPath = SIVUJETTI_INDEX_PATH,
                                string $errorLogFn = "error_log") {
        $this->db2 = $db2;
        $this->fs = $fs;
        $this->http = $http;
        $this->signer = $signer;
        $this->appEnv = $appEnv;
        $this->lastErrorDetails = [];
        $this->targetBackendDirPath = $targetBackendDirPath;
        $this->targetIndexDirPath = $targetIndexDirPath;
        $this->errorLogFn = $errorLogFn;
        self::$di = $appEnv->di;
    }
    /**
     * @param ?string $currentPackagesJson
     * @param int $lastCheckedAt
     * @param \ArrayObject<int, \Sivujetti\Plugin\Entities\Plugin> $currentPlugins
     * @param ?string $channel = "stable" "none" or "stable"
     * @return string[] Example ["sivujetti-0.16.0", "JetForms-0.16.0"]
     */
    public function getAndSyncAvailablePackages(?string $currentPackagesJson,
                                                int $lastCheckedAt,
                                                \ArrayObject $currentPlugins,
                                                ?string $channel = "stable"): array {
        $channelValidated = match($channel) {
            "none" => "none",
            "testing" => "testing",
            default => "stable",
        };
        if ($channelValidated === "none")
            return []; // Do nothing
        if ($channelValidated !== "stable")
            return []; // Not implemented yet
        // New packages already downloaded (but not installed)
        if ($currentPackagesJson)
            return self::onlyNames(JsonUtils::parse($currentPackagesJson));
        // Packages not yet downloaded, fetch & sync & return if available
        $now = time();
        $secsSinceLast = $now - $lastCheckedAt;
        if ($secsSinceLast > 60 * 60 * 6)
            return self::onlyNames(
                $this->doGetAndSyncPackagesFromRemoteServer($channelValidated, $now, $currentPlugins)
            );
        return [];
    }
    /**
     * @return int self::RESULT_*
     */
    public function beginUpdates(): int {
        $hasStarted = $this->hasUpdateJobBegun();
        if ($hasStarted) // Some other request has already started the update process
            return self::RESULT_ALREADY_IN_PROGRESS;

        // 1. Check dependencies
        $errs = [];
        if (!class_exists("ZipArchive"))
            $errs[] = "ZipArchive class / zip extension is missing";
        if (!extension_loaded("curl"))
            $errs[] = "curl is not available";
        if ($errs) {
            $this->lastErrorDetails = $errs;
            return self::RESULT_PRECONDITION_FAILED;
        }

        // 2. Check file permissions
        $fpath = SIVUJETTI_BACKEND_PATH . "write-test-" . time() . ".txt";
        $writeTestFile = function () use ($fpath) {
            $res = $this->fs->write($fpath, "...");
            return $res && $res > 2;
        };
        if (!($ok = $writeTestFile())) {
            $this->fs->chmod(SIVUJETTI_BACKEND_PATH, $this->fs->defaultDirPerms);
            $ok = $writeTestFile();
        }
        if ($ok) $this->fs->unlink($fpath);
        else {
            $this->lastErrorDetails = ["file writing permission is missing"];
            return self::RESULT_PRECONDITION_FAILED;
        }

        //
        if ($this->hasUpdateJobBegun()) // Double-check
            return self::RESULT_ALREADY_IN_PROGRESS;
        $this->updateUpdateJob([
            "startedAt" => time(),
        ]);
        return self::RESULT_OK;
    }
    /**
     * @param string $packageName An entry from $theWebsite->pendingUpdatesJson array
     * @return int self::RESULT_*
     */
    public function downloadUpdate(string $packageName): int {
        if (!$this->hasUpdateJobBegun()) { // Trying to download idx>0 item before item=0
            $this->lastErrorDetails = ["Expected update to be started"];
            return self::RESULT_BAD_INPUT;
        }

        \ignore_user_abort(true);
        if (\function_exists("set_time_limit"))
            \set_time_limit(300);

        [$targetFilePath, $targetFileName] = $this->createTargetFilePath($packageName);
        $resp = $this->http->downloadFileToDisk("https://u1.sivujetti.org/{$targetFileName}", $targetFilePath);
        if ($resp->status !== 200) {
            $this->lastErrorDetails = ["Failed to download `{$targetFileName}`"];
            return self::RESULT_DOWNLOAD_FAILED;
        }
        return self::RESULT_OK;
    }
    /**
     * @psalm-param Package $package Single entry from $theWebsite->pendingUpdatesJson array
     * @return int self::RESULT_*
     */
    public function installUpdate(object $package): int {
        if (!$this->hasUpdateJobBegun()) {
            $this->lastErrorDetails = ["Update not started"];
            return self::RESULT_BAD_INPUT;
        }
        [$filePath, $fileName, $dirId] = $this->createTargetFilePath($package->name);
        $sigLenFail = strlen($package->sig) !== 128;
        if ($sigLenFail ||
            !$this->signer->verify($package->sig, $this->fs->read($filePath), $this->appEnv->constants["UPDATE_KEY"])) {
            $this->lastErrorDetails = ["Checksum verification failed"];
            return $sigLenFail ? self::RESULT_BAD_INPUT : self::RESULT_VERIFICATION_FAILED;
        }
        //
        $localState = "opening-zip";
        try {
            $zip = new ZipPackageStream($this->fs);
            $toVersion = self::extractVersion($fileName);
            $zip->open($filePath);

            $phase1Tasks = [];
            $phase2Tasks = [];

            // == Phase 1 ====
            $localState = "creating-tasks";
            $phase1Tasks = $this->createFileUpdateTasks($zip);
            $tasks = $phase1Tasks;
            //
            $localState = "running-tasks";
            $currentTaskIdx = 0;
            for (; $currentTaskIdx < count($tasks); ++$currentTaskIdx) {
                $tasks[$currentTaskIdx]->exec(); // Copy files
            }

            // == Phase 2 ====
            $localState = "creating-tasks";
            $phase2Tasks = $this->createDbPatchTasks($zip, $toVersion, App::VERSION, $dirId);
            if ($phase2Tasks) {
                $tasks = array_merge($tasks, $phase2Tasks);
                //
                $localState = "running-tasks";
                // Note $currentTaskIdx === count($phase1Tasks) at this point
                for (; $currentTaskIdx < count($tasks); ++$currentTaskIdx) {
                    $tasks[$currentTaskIdx]->exec(); // migrate db
                }
            }

            //
            $localState = "finalizing";
            return self::RESULT_OK;
        } catch (\Exception $e) {
            if ($localState === "opening-zip" ||
                $localState === "creating-tasks" ||
                $localState === "running-tasks") {
                if ($localState === "running-tasks") {
                    $localState = "rolling-back";
                    try {
                        do {
                            $tasks[$currentTaskIdx]->rollBack();
                        } while ($currentTaskIdx--);
                    } catch (\Exception $e) {
                        // ??
                    }
                }
            } elseif ($localState === "finalizing") {
                // Do nothing
            }
            call_user_func($this->errorLogFn, LogUtils::formatError($e));
            return self::RESULT_FAILED;
        }
    }
    /**
     * @psalm-param Package[] $packages
     */
    public function finishUpdates(array $packages): int {
        foreach ($packages as $package) {
            [$filePath, $fileName, $dirId] = $this->createTargetFilePath($package->name);
            if (!$this->fs->unlink($filePath))
                call_user_func($this->errorLogFn, "Updater: Failed to delete {$fileName}.");
        }
        //
        $this->markUpdatesAsEnded();
        //
        return self::RESULT_OK;
    }
    /**
     * @return bool
     */
    public function hasUpdateJobBegun(): bool {
        return $this->getUpdateJob()->startedAt > 0;
    }
    /**
     * @param string $name "JetForms"
     * @param string $toVersion e.g. "0.5.0"
     * @param string $currentVersion = App::VERSION
     * @return self::RESULT_*
     * @deprecated
     */
    public function updatePlugin(string $name,
                                 string $toVersion,
                                 string $currentVersion = App::VERSION): int {
        \Sivujetti\ValidationUtils::checkIfValidaPathOrThrow($name, true);
        //
        $what = $name;
        $toVersion = $toVersion;
        $currentVersion = $currentVersion;
        [$validToVersion, $errorMessage] = self::getValidToVersion($toVersion, $currentVersion,
            allowSame: $what !== "core");
        if (!$validToVersion) {
            $this->lastErrorDetails = [$errorMessage];
            return self::RESULT_BAD_INPUT;
        }
        //
        $taskName = "updates:all";
        $updateJob = $this->getUpdateState($taskName);
        if ($updateJob->startedAt) // Some other request has already started the update process
            return self::RESULT_ALREADY_IN_PROGRESS;
        //
        $this->updateUpdateStateAsStarted($taskName);
        $localState = "opening-zip";
        try {
            $zip = new ZipPackageStream($this->fs);
            $filePath = "{$this->targetBackendDirPath}plugins/{$what}/{$what}-{$validToVersion}.zip";
            $zip->open($filePath);

            $phase1Tasks = [];
            $phase2Tasks = [];

            // == Phase 1 ====
            $localState = "creating-tasks";
            $phase1Tasks = $this->createFileUpdateTasks($zip, $toVersion, $currentVersion);
            $tasks = $phase1Tasks;
            //
            $localState = "running-tasks";
            $currentTaskIdx = 0;
            for (; $currentTaskIdx < count($tasks); ++$currentTaskIdx) {
                $tasks[$currentTaskIdx]->exec(); // Copy files
            }

            // == Phase 2 ====
            $localState = "creating-tasks";
            $phase2Tasks = $this->createDbPatchTasks($zip, $toVersion, $currentVersion, $what);
            if ($phase2Tasks) {
                $tasks = array_merge($tasks, $phase2Tasks);
                //
                $localState = "running-tasks";
                // Note $currentTaskIdx === count($phase1Tasks) at this point
                for (; $currentTaskIdx < count($tasks); ++$currentTaskIdx) {
                    $tasks[$currentTaskIdx]->exec(); // migrate db
                }
            }

            //
            $localState = "finalizing";
            $this->updateUpdateStateAsEnded($taskName);
            return self::RESULT_OK;
        } catch (\Exception $e) {
            if ($localState === "opening-zip" ||
                $localState === "creating-tasks" ||
                $localState === "running-tasks") {
                if ($localState === "running-tasks") {
                    $localState = "rolling-back";
                    try {
                        do {
                            $tasks[$currentTaskIdx]->rollBack();
                        } while ($currentTaskIdx--);
                    } catch (\Exception $e) {
                        // ??
                    }
                }
                $this->updateUpdateStateAsEnded($taskName, $localState, $e);
            } elseif ($localState === "finalizing") {
                // Do nothing
            }
            call_user_func($this->errorLogFn, LogUtils::formatError($e));
            return self::RESULT_FAILED;
        }
    }
    /**
     * @param string $taskName self::UPDATE_*_TASK
     * @return \Sivujetti\Update\Entities\Job
     * @deprecated
     */
    private function getUpdateState(string $taskName): Job {
        $job = $this->db2->select("\${p}jobs")
            ->fields(["startedAt"])
            ->where("`jobName` = ?", [$taskName])
            ->fetchAll(\PDO::FETCH_CLASS, Job::class)[0] ?? null; // #ref-1
        if (!($job instanceof Job)) throw new PikeException("Invalid database state", 301010);
        return $job;
    }
    /**
     * @param string $taskName self::UPDATE_*_TASK
     * @deprecated
     */
    private function updateUpdateStateAsStarted(string $taskName): void {
        $db = $this->db2->getDb();
        $db->beginTransaction(); // Force other requests/processes to wait at #ref-1
        $db->exec("UPDATE `\${p}jobs` SET `startedAt` = ? WHERE `jobName` = ?",
                  [time(), $taskName]);
        $db->commit();
    }
    /**
     * @param string $taskName self::UPDATE_*_TASK
     * @param ?string $failedWhile = null
     * @param ?\Exception $_failDetails = null
     * @deprecated
     */
    private function updateUpdateStateAsEnded(string $taskName,
                                              ?string $failedWhile = null,
                                              ?\Exception $_failDetails = null): void {
        $this->db2->update("\${p}jobs")
            ->values((object) ["startedAt" => 0])
            ->where("`jobName` = ?", [$taskName])
            ->execute();
    }
    /**
     * @return string[] ["Some error"] or []
     */
    public function getLastErrors(): array {
        return $this->lastErrorDetails;
    }
    /**
     * @param string $sneakyJsonFileLocalName
     * @param \Sivujetti\Update\PackageStreamInterface $package
     * @param bool $associative = false
     * @return array|object Parsed json data
     */
    public static function readSneakyJsonData(string $sneakyJsonFileLocalName,
                                              PackageStreamInterface $package,
                                              bool $associative = false): array|object {
        $str = $package->read($sneakyJsonFileLocalName); // @allow \Pike\PikeException
        if (!is_array($parsed = JsonUtils::parse(substr($str, strlen("<?php // ")),
                                                 asObject: !$associative)))
            throw new PikeException("Failed to parse the contents of `{$sneakyJsonFileLocalName}`",
                                    PikeException::BAD_INPUT);
        return $parsed;
    }
    /**
     * Returns a function that removes $basePath from the beginning of a string.
     *
     * @param string $basePath
     * @return \Closure
     */
    public static function makeRelatifier(string $basePath): \Closure {
        $after = strlen($basePath);
        return static fn($fullPath) => substr($fullPath, $after);
    }
    /**
     * @return array{0: string, 1: string, 2: string} [filePath, fileName, dirId]
     */
    private function createTargetFilePath(string $packageName): array {
        $targetFileName = "{$packageName}.zip";
        $dirId = "";
        $targetFilePath = "";
        if (\str_starts_with($packageName, "sivujetti-")) {
            $dirId = "core";
            $targetFilePath = "{$this->targetBackendDirPath}{$targetFileName}";
        } else {
            $dirId = self::extractId($targetFileName);
            $targetFilePath =  "{$this->targetBackendDirPath}plugins/{$dirId}/{$targetFileName}";
        }
        return [$targetFilePath, $targetFileName, $dirId];
    }
    /**
     * @param string $channelValidated
     * @param int $now
     * @param \ArrayObject<int, \Sivujetti\Plugin\Entities\Plugin> $currentPlugins
     * @psalm-return Package[]
     */
    private function doGetAndSyncPackagesFromRemoteServer(string $channelValidated,
                                                          int $now,
                                                          \ArrayObject $currentPlugins): array {
        if ($this->getUpdateJob()->startedAt)
            return [];

        $packages = [];
        $resp = $this->http->get("https://u1.sivujetti.org/latest-packages-{$channelValidated}.html?no-cache=1");
        if ($resp->status === 200) {
            $packagesAll = self::extractPackages($resp->data);
            $packages = array_values(array_filter($packagesAll, function ($pkg) use ($currentPlugins) {
                if (\version_compare(self::extractVersion($pkg->name), App::VERSION, "<=")) return false;
                $id = self::extractId($pkg->name);
                return $id === "sivujetti" || ArrayUtils::findIndexByKey($currentPlugins, $id, "name") > -1;
            }));
        }

        $data = array_merge(
            ["latestPackagesLastCheckedAt" => $now],
            $packages
                ? ["pendingUpdates" => JsonUtils::stringify($packages)]
                : []
        );
        $this->db2->update("\${p}theWebsite")
            ->values((object) $data)
            ->where("pendingUpdates is null")
            ->execute();

        return $packages;
    }
    /**
     * @param string $body Example '<!-- [{"name": "sivujetti-0.16.0", "sig": "2d1be3d...<128-chars-total>"}, {"name": "JetForms-0.16.0", "sig": "0b367...<128-chars-total>"}] -->'
     * @psalm-return Package[]
     */
    private static function extractPackages(string $body): array {
        $begin = "<!-- ";
        $end = " -->";
        $len = strlen($body) - strlen($begin) - strlen($end);
        $packages = JsonUtils::parse(substr($body, strlen($begin), $len));
        return $packages;
    }
    /**
     * @param string $packageName Example "sivujetti-0.16.0"
     * @return string Example "0.16.0"
    */
    private static function extractVersion(string $packageName): string {
        return explode("-", $packageName, 2)[1];
    }
    /**
     * @param string $packageName Example "sivujetti-0.16.0"
     * @return string Example "sivujetti"
     */
    private static function extractId(string $packageName): string {
        return explode("-", $packageName)[0];
    }
    /**
     * @param string $toVersion
     * @param string $currentVersion
     * @param bool $allowSame = false
     * @return array ["<validVersionNumber>", null] or [null, "Error message"]
     */
    private static function getValidToVersion(string $toVersion,
                                              string $currentVersion,
                                              bool $allowSame = false): array {
        $validToVersion = null;
        if (!($validToVersion = self::getValidVersionNumberOrNull($toVersion)))
            return [null, "toVersion is not valid"];
        //
        $validCurrentVersion = null;
        if (!($validCurrentVersion = self::getValidVersionNumberOrNull($currentVersion)))
            return [null, "currentVersion is not valid"];
        //
        if (!\version_compare($toVersion, $validCurrentVersion, !$allowSame ? ">" : ">="))
            return [null, "toVersion must be " . (!$allowSame ? ">" : ">=") . " than currentVersion"];
        //
        return [$validToVersion, null];
    }
    /**
     * @param int $flags = 0
     * @return ?string "<validVersionNumber>" or null
     */
    private static function getValidVersionNumberOrNull(string $candidate): ?string {
        $trimmed = trim($candidate);
        if (preg_match('/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)[a-zA-Z0-9-]*$/', $trimmed))
            return $trimmed;
        return null;
    }
    /**
     * @return \Sivujetti\Update\Entities\Job
     */
    private function getUpdateJob(): Job {
        $job = $this->db2->select("\${p}jobs")
            ->fields(["startedAt"])
            ->where("`jobName` = ?", [self::UPDATE_JOB_NAME_DEFAULT])
            ->fetchAll(\PDO::FETCH_CLASS, Job::class)[0] ?? null; // #ref-1
        if (!($job instanceof Job)) throw new PikeException("Invalid database state", 301010);
        return $job;
    }
    /**
     * @param string $taskName self::UPDATE_*_TASK
     */
    private function updateUpdateJob(array $data): void {
        $db = $this->db2->getDb();
        $db->beginTransaction(); // Force other requests/processes to wait at #ref-1
        $this->db2->update("\${p}jobs")
            ->values((object) $data)
            ->where("jobName = ?", [self::UPDATE_JOB_NAME_DEFAULT])
            ->execute();
        $db->commit();
    }
    /**
     * @param \Sivujetti\Update\ZipPackageStream $zip
     * @return \Sivujetti\Update\UpdateProcessTaskInterface[]
     */
    private function createFileUpdateTasks(ZipPackageStream $zip): array {
        return [
            new UpdateBackendSourceFilesTask($zip, $this->fs,
                self::readSneakyJsonData(PackageStreamInterface::LOCAL_NAME_BACKEND_FILES_LIST, $zip),
                $this->targetBackendDirPath),
            new UpdateIndexSourceFilesTask($zip, $this->fs,
                self::readSneakyJsonData(PackageStreamInterface::LOCAL_NAME_INDEX_FILES_LIST, $zip),
                $this->targetIndexDirPath)
        ];
    }
    /**
     * @param \Sivujetti\Update\ZipPackageStream $zip
     * @param string $toVersion
     * @param string $currentVersion
     * @param string $for "core" or "SomePlugin"
     * @return \Sivujetti\Update\UpdateProcessTaskInterface[]
     */
    private function createDbPatchTasks(ZipPackageStream $zip,
                                        string $toVersion,
                                        string $currentVersion,
                                        string $for): array {
        $backendFilesList = self::readSneakyJsonData(PackageStreamInterface::LOCAL_NAME_BACKEND_FILES_LIST, $zip);
        [$mustStartWith, $splitWith, $ns] = $for === "core"
            ? ["\$backend/sivujetti/src/Update/Patch/", "/src/Update/Patch/", "\\Sivujetti\\Update\\Patch\\"]
            : ["\$backend/plugins/{$for}/Patch/",       "/{$for}/Patch/",     "\\SitePlugins\\{$for}\\Patch\\"];
        $nsdRelFilePaths = array_filter($backendFilesList, fn(string $nsdRelFilePath) =>
            str_starts_with($nsdRelFilePath, $mustStartWith)
        );
        return array_map(static function (string $nsdRelFilePath) use ($toVersion, $currentVersion, $splitWith, $ns) {
            $fileName = explode($splitWith, $nsdRelFilePath, 2)[1]; // `\$backend/sivujetti/src/Update/Patch/PatchDbTask1.php` -> `PatchDbTask1.php` or
                                                                    // `\$backend/plugins/JetForms/Patch/PatchDbTask1.php` -> `PatchDbTask1.php`
            $Cls = $ns . explode(".", $fileName)[0];
            return self::$di->make($Cls, [":toVersion" => $toVersion, ":currentVersion" => $currentVersion]);
        }, $nsdRelFilePaths);
    }
    /**
     */
    private function markUpdatesAsEnded(): void {
        $this->db2->update("\${p}jobs")
            ->values((object) ["startedAt" => 0])
            ->where("`jobName` = ?", [self::UPDATE_JOB_NAME_DEFAULT])
            ->execute();
        $this->db2->update("\${p}theWebsite")
            ->values((object) ["pendingUpdates" => null, "lastUpdatedAt" => time()])
            ->where("1=1")
            ->execute();
    }
    /**
     * @psalm-param Package[] $packages
     * @return string[]
     */
    private static function onlyNames(array $packages): array {
        return array_map(fn($itm) => $itm->name, $packages);
    }
}
