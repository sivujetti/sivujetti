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
    /**
     * @param \Pike\Db $db
     * @param \Pike\FileSystem $fs
     * @param string $targetBackendDirPath = SIVUJETTI_BACKEND_PATH Must end with "/", mainly used by tests
     */
    public function __construct(Db $db,
                                FileSystem $fs,
                                string $targetBackendDirPath = SIVUJETTI_BACKEND_PATH) {
        $this->db = $db;
        $this->fs = $fs;
        $this->lastErrorDetails = "";
        $this->targetBackendDirPath = $targetBackendDirPath;
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
        $updateJob = self::getUpdateState($this->db);
        if ($updateJob->startedAt) // Some other request has already started the update process
            return self::RESULT_ALREADY_IN_PROGRESS;
        //
        self::updateUpdateStateAsStarted($this->db);
        $localState = "opening-zip";
        try {
            $zip = new ZipPackageStream($this->fs);
            $filePath = "{$this->targetBackendDirPath}sivujetti-{$validToVersion}.zip";
            $zip->open($filePath);
            //
            $localState = "creating-tasks";
            $tasks = self::createUpdateTasks($zip, $this->fs, $this->targetBackendDirPath);
            //
            $localState = "running-tasks";
            $currentTaskIdx = 0;
            for (; $currentTaskIdx < count($tasks); ++$currentTaskIdx) {
                $tasks[$currentTaskIdx]->exec(); // Copy files, migrate db etc..
            }
            $localState = "finalizing";
            self::updateUpdateStateAsEnded($this->db);
            return self::RESULT_OK;
        } catch (\Exception $e) {
            if ($localState === "opening-zip" ||
                $localState === "creating-tasks" ||
                $localState === "running-tasks") {
                if ($localState === "running-tasks") {
                try {
                    do {
                        $tasks[$currentTaskIdx]->rollBack();
                    } while ($currentTaskIdx--);
                } catch (\Exception $e) {
                    // ??
                }
                }
                self::updateUpdateStateAsEnded($this->db, $localState, $e);
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
     * @param \Pike\Db $db
     * @return \Sivujetti\Update\Entities\Job
     */
    private static function getUpdateState(Db $db): Job {
        return $db->fetchOne("SELECT `startedAt` FROM \${p}jobs WHERE `jobName` = ?",
                             [self::UPDATE_CORE_TASK],
                             \PDO::FETCH_CLASS,
                             Job::class); // #ref-1
    }
    /**
     * @param \Pike\Db $db
     */
    private static function updateUpdateStateAsStarted(Db $db): void {
        $db->beginTransaction(); // Force other requests/processes to wait at #ref-1
        $db->exec("UPDATE \${p}jobs SET `startedAt` = ? WHERE `jobName` = ?",
                  [time(), self::UPDATE_CORE_TASK]);
        $db->commit();
    }
    /**
     * @param \Sivujetti\Update\ZipPackageStream $zip
     * @param \Pike\FileSystem $fs
     * @param string $targetBackendDirPath
     * @return \Sivujetti\Update\UpdateProcessTaskInterface[]
     */
    private static function createUpdateTasks(ZipPackageStream $zip,
                                              FileSystem $fs,
                                              string $targetBackendDirPath): array {
        return [
            new UpdateBackendSourceFilesTask($zip, $fs,
                self::readSneakyJsonData(PackageStreamInterface::LOCAL_NAME_BACKEND_FILES_LIST, $zip),
                $targetBackendDirPath)
        ];
    }
    /**
     * @param \Pike\Db $db
     * @param ?string $failedWhile = null
     * @param ?\Exception $_failDetails = null
     */
    private static function updateUpdateStateAsEnded(Db $db,
                                                     ?string $failedWhile = null,
                                                     ?\Exception $_failDetails = null): void {
        $db->exec("UPDATE \${p}jobs SET `startedAt` = 0 WHERE `jobName` = ?",
                  [self::UPDATE_CORE_TASK]);
    }
}
