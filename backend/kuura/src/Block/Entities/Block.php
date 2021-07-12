<?php declare(strict_types=1);

namespace KuuraCms\Block\Entities;

final class Block {
    public const TYPE_COLUMNS = 'Columns';
    public const TYPE_HEADING = 'Heading';
    public const TYPE_PARAGRAPH = 'Paragraph';
    public const TYPE_SECTION = 'Section';
    /** @var string self::TYPE_* */
    public string $type;
    /** @var ?string */
    public ?string $title;
    /** @var string e.g. 'my-file', 'kuura:block-auto' */
    public string $renderer;
    /** @var string */
    public string $id;
    /** @var \KuuraCms\Block\Entities\Block[] */
    public array $children;

    /* If self::TYPE_COLUMNS
    public string $cssClass; */

    /* If self::TYPE_HEADING
    public string $text;
    public int $level; */

    /* If self::TYPE_PARAGRAPH
    public string $text; */

    /* If self::TYPE_SECTION
    public string $cssClass;
    public string $bgImage; */

    /**
     * @param object $data
     * @return \KuuraCms\Block\Entities\Block
     */
    public static function fromObject(object $data): Block {
        $out = new Block;
        $out->type = $data->type;
        $out->title = $data->title;
        $out->renderer = $data->renderer;
        $out->id = $data->id;
        $out->props = $data->props;
        $out->children = [];
        foreach ($data->children as $child)
            $out->children[] = self::fromObject($child);
        foreach ($data->props as $prop) {
            $out->{$prop->key} = $prop->value;
        }
        return $out;
    }
}
