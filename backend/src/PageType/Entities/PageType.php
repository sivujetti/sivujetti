<?php declare(strict_types=1);

namespace KuuraCms\PageType\Entities;

final class PageType {
    /** @var string */
    public string $name;
    /** @var array */
    public array $fields;
    /** @var bool */
    public bool $isListable;
    /**
     * @param object $row
     * @return self
     */
    static function fromParentRs(object $row): PageType {
        $out = new self;
        $out->name = $row->pageTypeName;
        $out->fields = json_decode($row->pageTypeFields, false, 512, JSON_THROW_ON_ERROR);
        $out->isListable = (bool) $row->pageTypeIsListable;
        return $out;
    }
}
