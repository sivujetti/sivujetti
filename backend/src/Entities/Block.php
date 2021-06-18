<?php declare(strict_types=1);

namespace KuuraCms\Entities;

final class Block extends \stdClass {
    public const TYPE_COLUMNS = 'columns';
    public const TYPE_CONTACT_FORM = 'contact-form';
    public const TYPE_FORMATTED_TEXT = 'formatted-text';
    public const TYPE_HEADING = 'heading';
    public const TYPE_LISTING = 'dynamic-listing';
    public const TYPE_MENU = 'menu';
    public const TYPE_PARAGRAPH = 'paragraph';
    public const TYPE_SECTION = 'section';
    /** @var string self::TYPE_* */
    public string $type;
    /** @var string e.g. 'main', 'sidebar' */
    public string $section;
    /** @var string e.g. 'MyTag', 'file-name' */
    public string $renderer;
    /** @var string */
    public string $id;
    /** @var string */
    public string $path;
    /** @var ?string e.g. 'Articles' */
    public ?string $title;
    /** @var \KuuraCms\Entities\Block[] */
    public array $children;

    /* If self::TYPE_HEADING
    public string $text;
    public int $level; */

    /* If self::TYPE_PARAGRAPH
    public string $text; */

    /* If self::TYPE_FORMATTED_TEXT
    public string $html; */

    /* If self::TYPE_LISTING
    public string $fetchFilters; */

    /* If <someUserDefinedType>
    public any $prop1;
    public any $prop2;
    etc.. */

    public static function fromDbResult(object $row, array $rows): Block {
        $out = new self;
        $out->type = $row->blockType;
        $out->section = $row->blockSection;
        $out->renderer = $row->blockRenderer;
        $out->id = $row->blockId;
        $out->path = "{$row->blockParentPath}{$row->blockId}/";
        $out->title = $row->blockTitle ?? null;
        $out->children = [];
        foreach ($rows as $row2) {
            if ($row2->blockPropBlockId === $out->id)
                $out->{$row2->blockPropKey} = $row2->blockPropValue;
        }
        return $out;
    }
}
