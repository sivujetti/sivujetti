<?php declare(strict_types=1);

namespace Sivujetti\Layout\Entities;

final class Layout {
    public const PART_TYPE_GLOBAL_BLOCK_TREE = "globalBlockTree";
    public const PART_TYPE_PAGE_CONTENTS = "pageContents";
    /** @var string e.g. "1" */
    public string $id;
    /** @var string e.g. "Default" */
    public string $friendlyName;
    /** @var string e.g. "layout.default.tmpl.php" */
    public string $relFilePath;
    /** @var object[] e.g. [{"type":"globalBlockTree","globalBlockTreeId":"20"}, {"type":"pageContents"}] */
    public array $structure;
    /**
     * @param object $row
     * @return self
     */
    public static function fromParentRs(object $row): Layout {
        $out = new self;
        $out->id = $row->layoutId;
        $out->friendlyName = $row->layoutFriendlyName;
        $out->relFilePath = $row->layoutRelFilePath;
        $out->structure = $row->layoutStructureJson
            ? json_decode($row->layoutStructureJson, flags: JSON_THROW_ON_ERROR)
            : [];
        return $out;
    }
}
