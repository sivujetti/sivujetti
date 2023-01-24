<?php declare(strict_types=1);

namespace Sivujetti\GlobalBlockTree\Entities;

final class GlobalBlockTree extends \stdClass {
    /** @var string e.g. "1" */
    public string $id;
    /** @var string e.g. "Header", "Default footer" */
    public string $name;
    /** @var ?array<int, \Sivujetti\Block\Entities\Block> */
    public ?array $blocks;
}
