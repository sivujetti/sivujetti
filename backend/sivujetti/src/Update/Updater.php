<?php declare(strict_types=1);

namespace Sivujetti\Update;

use Pike\{Db, FileSystem, PikeException};
use Sivujetti\App;
use Sivujetti\Update\Entities\Job;

final class Updater {
    public const RESULT_BAD_INPUT           = 111010;
    public const RESULT_ALREADY_IN_PROGRESS = 111011;
    public const RESULT_FAILED              = 111012;
    public const RESULT_OK                  = 0;
    private const UPDATE_CORE_TASK = "update-core";
    /** @var \Pike\Db */
    private Db $db;
    /** @var \Pike\FileSystem */
    private FileSystem $fs;
    /** @var string "Some error" or "" */
    private string $lastErrorDetails;
    /** @var string */
    private string $targetBackendDirPath;
    /** @var string */
    private string $targetIndexDirPath;
    /**
     * @param \Pike\Db $db
     * @param \Pike\FileSystem $fs
     * @param string $targetBackendDirPath = SIVUJETTI_BACKEND_PATH Must end with "/", mainly used by tests
     * @param string $targetIndexDirPath = SIVUJETTI_PUBLIC_PATH
     */
    public function __construct(Db $db,
                                FileSystem $fs,
                                string $targetBackendDirPath = SIVUJETTI_BACKEND_PATH,
                                string $targetIndexDirPath = SIVUJETTI_PUBLIC_PATH) {
        $this->db = $db;
        $this->fs = $fs;
        $this->lastErrorDetails = "";
        $this->targetBackendDirPath = $targetBackendDirPath;
        $this->targetIndexDirPath = $targetIndexDirPath;
    }
    /**
     * @param string $toVersion e.g. "0.5.0"
     * @param string $currentVersion = App::VERSION
     * @return self::RESULT_*
     */
    public function updateCore(string $toVersion,
                               string $currentVersion = App::VERSION): int {
        [$validToVersion, $errorMessage] = self::getValidToVersion($toVersion, $currentVersion);
        if (!$validToVersion) {
            $this->lastErrorDetails = $errorMessage;
            return self::RESULT_BAD_INPUT;
        }
        //
        $updateJob = $this->getUpdateState();
        if ($updateJob->startedAt) // Some other request has already started the update process
            return self::RESULT_ALREADY_IN_PROGRESS;
        //
        $this->updateUpdateStateAsStarted();
        $localState = "opening-zip";
        try {
            $zip = new ZipPackageStream($this->fs);
            $filePath = "{$this->targetBackendDirPath}sivujetti-{$validToVersion}.zip";
            $zip->open($filePath);
            //
            $localState = "creating-tasks";
            $tasks = $this->createUpdateTasks($zip);
            //
            $localState = "running-tasks";
            $currentTaskIdx = 0;
            for (; $currentTaskIdx < count($tasks); ++$currentTaskIdx) {
                $tasks[$currentTaskIdx]->exec(); // Copy files, migrate db etc..
            }
            $localState = "finalizing";
            self::updateUpdateStateAsEnded();
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
                $this->updateUpdateStateAsEnded($localState, $e);
            } elseif ($localState === "finalizing") {
                // Do nothing
            }
            return self::RESULT_FAILED;
        }
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
     * @param bool $associative = fasle
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
     * @param string $toVersion
     * @param string $currentVersion
     * @return ["<validVersionNumber>", null] or [null, "Error message"]
     */
    private static function getValidToVersion(string $toVersion,
                                              string $currentVersion): array {
        $validToVersion = null;
        if (!($validToVersion = self::getValidVersionNumberOrNull($toVersion)))
            return [null, "toVersion is not valid"];
        //
        $validCurrentVersion = null;
        if (!($validCurrentVersion = self::getValidVersionNumberOrNull($currentVersion)))
            return [null, "currentVersion is not valid"];
        //
        if (!version_compare($validCurrentVersion, $validToVersion, "<"))
            return [null, "toVersion must be > than currentVersion"];
        //
        return [$validToVersion, null];
    }
    /**
     * @return string $candidate
     * @return string "<validVersionNumber>" or null
     */
    private static function getValidVersionNumberOrNull(string $candidate): ?string {
        $trimmed = trim($candidate);
        if (preg_match('/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)[a-zA-Z-]*$/', $trimmed))
            return $trimmed;
        return null;
    }
    /**
     * @return \Sivujetti\Update\Entities\Job
     */
    private function getUpdateState(): Job {
        $job = $this->db->fetchOne("SELECT `startedAt` FROM `\${p}jobs` WHERE `jobName` = ?",
                                   [self::UPDATE_CORE_TASK],
                                   \PDO::FETCH_CLASS,
                                   Job::class); // #ref-1
        if (!($job instanceof Job)) throw new PikeException("Invalid database state", 301010);
        return $job;
    }
    /**
     */
    private function updateUpdateStateAsStarted(): void {
        $this->db->beginTransaction(); // Force other requests/processes to wait at #ref-1
        $this->db->exec("UPDATE `\${p}jobs` SET `startedAt` = ? WHERE `jobName` = ?",
                        [time(), self::UPDATE_CORE_TASK]);
        $this->db->commit();
    }
    /**
     * @param \Sivujetti\Update\ZipPackageStream $zip
     * @return \Sivujetti\Update\UpdateProcessTaskInterface[]
     */
    private function createUpdateTasks(ZipPackageStream $zip): array {
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
     * @param ?string $failedWhile = null
     * @param ?\Exception $_failDetails = null
     */
    private function updateUpdateStateAsEnded(?string $failedWhile = null,
                                              ?\Exception $_failDetails = null): void {
        $this->db->exec("UPDATE `\${p}jobs` SET `startedAt` = 0 WHERE `jobName` = ?",
                        [self::UPDATE_CORE_TASK]);
    }
}
