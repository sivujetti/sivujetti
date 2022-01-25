<?php declare(strict_types=1);

namespace Sivujetti\PageType\Entities;

final class PageType {
    public const PAGE = "Pages";
    public const SLUG_PAGE = "pages";
    public const STATUS_COMPLETE = 0;
    public const STATUS_DRAFT = 1;
    /** @var string */
    public string $name;
    /** @var string */
    public string $friendlyName;
    /** @var string */
    public string $friendlyNamePlural;
    /** @var string */
    public string $description;
    /** @var string */
    public string $slug;
    /** @var array */
    public array $blockFields;
    /** @var array e.g. [{name: "price", "friendlyName": "Price", dataType: {"type": "text"}, "defaultValue": "1999"...}...] */
    public array $ownFields;
    /** @var array e.g. {title: {defaultValue: "My page"}...} */
    public object $defaultFields;
    /** @var string */
    public string $defaultLayoutId;
    /** @var int self::STATUS_* */
    public int $status;
    /** @var bool */
    public bool $isListable;
    /**
     * @param object $row
     * @return self
     */
    public static function fromParentRs(object $row): PageType {
        $out = new self;
        $out->name = $row->pageTypeName;
        $out->slug = $row->pageTypeSlug;
        $out->friendlyName = $row->pageTypeFriendlyName;
        $out->friendlyNamePlural = $row->pageTypeFriendlyNamePlural;
        $out->description = $row->pageTypeDescription;
        $fields = json_decode($row->pageTypeFieldsJson, flags: JSON_THROW_ON_ERROR);
        $out->blockFields = $fields->blockFields;
        $out->ownFields = $fields->ownFields;
        $out->defaultFields = $fields->defaultFields;
        $out->defaultLayoutId = $row->pageTypeDefaultLayoutId;
        $out->status = (int) $row->pageTypeStatus;
        $out->isListable = (bool) $row->pageTypeIsListable;
        return $out;
    }
    /**
     * @param object $row
     * @return self
     */
    public static function fromRawPageType(object $raw): PageType {
        return self::fromParentRs((object) [
            "pageTypeName" => $raw->name,
            "pageTypeSlug" => $raw->slug,
            "pageTypeFriendlyName" => $raw->friendlyName,
            "pageTypeFriendlyNamePlural" => $raw->friendlyNamePlural,
            "pageTypeDescription" => $raw->description,
            "pageTypeFieldsJson" => $raw->fields,
            "pageTypeDefaultLayoutId" => $raw->defaultLayoutId,
            "pageTypeStatus" => $raw->status,
            "pageTypeIsListable" => $raw->isListable,
        ]);
    }
}
