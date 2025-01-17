<?php declare(strict_types=1);

namespace Sivujetti\StoredObjects\Entities;

/**
 * @template DataShape of array<string, mixed>
 */
final class Entry extends \stdClass {
    /** @var string e.g. "JetForms:mailSendSettings" */
    public string $objectName;
    /** @var DataShape */
    public array $data;
    /** @var string */
    public string $dataJson;
}
