<?php declare(strict_types=1);

namespace Sivujetti\PageType\Entities;

final class PageType {
    public const PAGE = 'Pages';
    /** @var string */
    public string $name;
    /** @var string */
    public string $slug;
    /** @var array */
    public array $blockFields;
    /** @var array */
    public array $ownFields;
    /** @var bool */
    public bool $isListable;
    /**
     * @param object $row
     * @return self
     */
    public static function fromParentRs(object $row): PageType {
        $out = new self;
        $out->name = $row->pageTypeName;
        $out->blockFields = json_decode($row->pageTypeBlockFields, false, 512, JSON_THROW_ON_ERROR);
        $out->ownFields = json_decode($row->pageTypeOwnFields, false, 512, JSON_THROW_ON_ERROR);
        $out->isListable = (bool) $row->pageTypeIsListable;
        return $out;
    }
}
