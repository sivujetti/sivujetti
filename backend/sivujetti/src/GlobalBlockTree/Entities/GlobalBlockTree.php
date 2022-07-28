<?php declare(strict_types=1);

namespace Sivujetti\GlobalBlockTree\Entities;

final class GlobalBlockTree {
    /** @var string e.g. "1" */
    public string $id;
    /** @var string e.g. "Header", "Default footer" */
    public string $name;
    /** @var ?array<int, \Sivujetti\Block\Entities\Block> */
    public ?array $blocks;
}
