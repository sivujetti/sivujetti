<?php declare(strict_types=1);

namespace Sivujetti\Layout\Entities;

final class Layout {
    /** @var string e.g. "1" */
    public string $id;
    /** @var string e.g. "Default" */
    public string $friendlyName;
    /** @var string e.g. "layout.default.tmpl.php" */
    public string $relFilePath;
    /** @var object[] e.g. [{"type":"globalBlockTree","globalBlockTreeId":"20"}, {"type":"pageContents"}] */
    public array $structure;
}
