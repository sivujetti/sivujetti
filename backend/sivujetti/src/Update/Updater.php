<?php declare(strict_types=1);

namespace Sivujetti\Update;

use Pike\{FileSystem, PikeException};
use Pike\Db\FluentDb;
use Sivujetti\{App, LogUtils};
use Sivujetti\Update\Entities\Job;
use Sivujetti\ValidationUtils;

final class Updater {
    public const RESULT_BAD_INPUT           = 111010;
    public const RESULT_ALREADY_IN_PROGRESS = 111011;
    public const RESULT_FAILED              = 111012;
    public const RESULT_OK                  = 0;
    private const UPDATE_CORE_TASK   = "update-core";
    private const UPDATE_PLUGIN_TASK = "update-plugin";
    /** @var \Pike\Db\FluentDb */
    private FluentDb $db;
    /** @var \Pike\FileSystem */
    private FileSystem $fs;
    /** @var string "Some error" or "" */
    private string $lastErrorDetails;
    /** @var string */
    private string $targetBackendDirPath;
    /** @var string */
    private string $targetIndexDirPath;
    /** @var callable */
    private string $errorLogFn;
    /**
     * @param \Pike\Db\FluentDb $db
     * @param \Pike\FileSystem $fs
     * @param string $targetBackendDirPath = SIVUJETTI_BACKEND_PATH Must end with "/", mainly used by tests
     * @param string $targetIndexDirPath = SIVUJETTI_INDEX_PATH
     * @param string $errorLogFn = "error_log" Mainly for tests
     */
    public function __construct(FluentDb $db,
                                FileSystem $fs,
                                string $targetBackendDirPath = SIVUJETTI_BACKEND_PATH,
                                string $targetIndexDirPath = SIVUJETTI_INDEX_PATH,
                                string $errorLogFn = "error_log") {
        $this->db = $db;
        $this->fs = $fs;
        $this->lastErrorDetails = "";
        $this->targetBackendDirPath = $targetBackendDirPath;
        $this->targetIndexDirPath = $targetIndexDirPath;
        $this->errorLogFn = $errorLogFn;
    }
    /**
     * @param string $toVersion e.g. "0.5.0"
     * @param string $currentVersion = App::VERSION
     * @return self::RESULT_*
     */
    public function updateCore(string $toVersion,
                               string $currentVersion = App::VERSION): int {
        return $this->doUpdate("core", $toVersion, $currentVersion);
    }
    /**
     * @param string $name "JetForms"
     * @param string $toVersion e.g. "0.5.0"
     * @param string $currentVersion = App::VERSION
     * @return self::RESULT_*
     */
    public function updatePlugin(string $name,
                                string $toVersion,
                                string $currentVersion = App::VERSION): int {
        ValidationUtils::checkIfValidaPathOrThrow($name, true);
        return $this->doUpdate($name, $toVersion, $currentVersion);
    }
    /**
     * @return string "Some error" or ""
     */
    public function getLastError(): string {
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
        if (($parsed = json_decode(substr($str, strlen("<?php // ")),
                                   $associative,
                                   flags: JSON_THROW_ON_ERROR)) === null)
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
     * @param string $what "core" or "SomePlugin"
     * @param string $toVersion e.g. "0.5.0"
     * @param string $currentVersion = App::VERSION
     * @return int self::RESULT_*
     */
    private function doUpdate(string $what, string $toVersion, string $currentVersion): int {
        [$validToVersion, $errorMessage] = self::getValidToVersion($toVersion, $currentVersion,
            allowSame: $what !== "core");
        if (!$validToVersion) {
            $this->lastErrorDetails = $errorMessage;
            return self::RESULT_BAD_INPUT;
        }
        //
        $taskName = $what === "core" ? self::UPDATE_CORE_TASK : self::UPDATE_PLUGIN_TASK;
        $updateJob = $this->getUpdateState($taskName);
        if ($updateJob->startedAt) // Some other request has already started the update process
            return self::RESULT_ALREADY_IN_PROGRESS;
        //
        $this->updateUpdateStateAsStarted($taskName);
        $localState = "opening-zip";
        try {
            $zip = new ZipPackageStream($this->fs);
            $filePath = $what === "core"
                ? "{$this->targetBackendDirPath}sivujetti-{$validToVersion}.zip"
                : "{$this->targetBackendDirPath}plugins/{$what}/{$what}-{$validToVersion}.zip";
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
        if (!version_compare($toVersion, $validCurrentVersion, !$allowSame ? ">" : ">="))
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
     * @param string $taskName self::UPDATE_*_TASK
     * @return \Sivujetti\Update\Entities\Job
     */
    private function getUpdateState(string $taskName): Job {
        $job = $this->db->select("\${p}jobs", Job::class)
            ->fields(["startedAt"])
            ->where("`jobName` = ?", [$taskName])
            ->fetchAll()[0] ?? null; // #ref-1
        if (!($job instanceof Job)) throw new PikeException("Invalid database state", 301010);
        return $job;
    }
    /**
     * @param string $taskName self::UPDATE_*_TASK
     */
    private function updateUpdateStateAsStarted(string $taskName): void {
        $db = $this->db->getDb();
        $db->beginTransaction(); // Force other requests/processes to wait at #ref-1
        $db->exec("UPDATE `\${p}jobs` SET `startedAt` = ? WHERE `jobName` = ?",
                  [time(), $taskName]);
        $db->commit();
    }
    /**
     * @param \Sivujetti\Update\ZipPackageStream $zip
     * @param string $toVersion
     * @param string $currentVersion
     * @return \Sivujetti\Update\UpdateProcessTaskInterface[]
     */
    private function createFileUpdateTasks(ZipPackageStream $zip, string $toVersion, string $currentVersion): array {
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
        return array_map(function (string $nsdRelFilePath) use ($toVersion, $currentVersion, $splitWith, $ns) {
            $fileName = explode($splitWith, $nsdRelFilePath, 2)[1]; // `\$backend/sivujetti/src/Update/Patch/PatchDbTask1.php` -> `PatchDbTask1.php` or
                                                                    // `\$backend/plugins/JetForms/Patch/PatchDbTask1.php` -> `PatchDbTask1.php`
            $Cls = $ns . explode(".", $fileName)[0];
            return App::$adi->make($Cls, [":toVersion" => $toVersion, ":currentVersion" => $currentVersion]);
        }, $nsdRelFilePaths);
    }
    /**
     * @param string $taskName self::UPDATE_*_TASK
     * @param ?string $failedWhile = null
     * @param ?\Exception $_failDetails = null
     */
    private function updateUpdateStateAsEnded(string $taskName,
                                              ?string $failedWhile = null,
                                              ?\Exception $_failDetails = null): void {
        $this->db->update("\${p}jobs")
            ->values((object) ["startedAt" => 0])
            ->where("`jobName` = ?", [$taskName])
            ->execute();
    }
}
