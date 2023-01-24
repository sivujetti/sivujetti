<?php declare(strict_types=1);

namespace Sivujetti\Update\Entities;

final class Job extends \stdClass {
    /** @var string */
    public string $id;
    /** @var string e.g. "update-core" */
    public string $jobName;
    /** @var int Unix timestamp, or 0 */
    public int $startedAt;
}
