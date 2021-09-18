<?php declare(strict_types=1);

namespace Sivujetti\Update;

/**
 * An interface for update tasks (OverwriteBackendFilesTask, MigrateDbTask etc.).
 */
interface UpdateProcessTaskInterface {
    /**
     * Copies files, writes data to db etc.
     */
    public function exec(): void;
    /**
     * Tries to undo exec().
     */
    public function rollBack(): void;
}
