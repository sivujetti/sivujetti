<?php declare(strict_types=1);

namespace Sivujetti\StoredObjects\Entities;

/**
 * @psalm-template DataShape
 */
final class Entry extends \stdClass {
    /** @var string e.g. "JetForms:mailSendSettings" */
    public string $objectName;
    /** @psalm-var DataShape */
    public array $data;
}
