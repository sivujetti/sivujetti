<?php declare(strict_types=1);

namespace Sivujetti\PageType\Entities;

final class PageType {
    public const PAGE = "Pages";
    /** @var string */
    public string $name;
    /** @var string */
    public string $slug;
    /** @var array */
    public array $blockFields;
    /** @var array e.g. [{name: "categories", dataType: "json"...}...] */
    public array $ownFields;
    /** @var array e.g. {title: {defaultValue: "My page"}...} */
    public object $defaultFields;
    /** @var bool */
    public bool $isListable;
    /**
     * @param object $row
     * @return self
     */
    public static function fromParentRs(object $row): PageType {
        $out = new self;
        $out->name = $row->pageTypeName;
        $fields = json_decode($row->pageTypeFieldsJson, flags: JSON_THROW_ON_ERROR);
        $out->blockFields = $fields->blockFields;
        $out->ownFields = $fields->ownFields;
        $out->defaultFields = $fields->defaultFields;
        $out->isListable = (bool) $row->pageTypeIsListable;
        return $out;
    }
}
