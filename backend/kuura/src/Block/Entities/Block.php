<?php declare(strict_types=1);

namespace KuuraCms\Block\Entities;

final class Block {
    public const TYPE_HEADING = 'Heading';
    public const TYPE_PARAGRAPH = 'Paragraph';
    public const TYPE_SECTION = 'Section';
    public string $type;
    public ?string $title;
    public string $renderer;
    public array $children;
    public static function fromObject(object $data): Block {
        $out = new Block;
        $out->type = $data->type;
        $out->title = $data->title;
        $out->renderer = $data->renderer;
        $out->children = [];
        foreach ($data->children as $child)
            $out->children[] = self::fromObject($child);
        return $out;
    }
}
