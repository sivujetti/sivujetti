<?php declare(strict_types=1);

namespace KuuraCms\Entities;

final class ContentType {
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
    static function fromParentRs(object $row): ContentType {
        $out = new self;
        $out->name = $row->contentTypeName;
        $out->fields = json_decode($row->contentTypeFields, false, 512, JSON_THROW_ON_ERROR);
        $out->isListable = (bool) $row->contentTypeIsListable;
        return $out;
    }
}
