<?php declare(strict_types=1);

namespace Sivujetti\Block\Entities;

use Sivujetti\PushIdGenerator;

final class Block extends \stdClass {
    public const TYPE_BUTTON           = "Button";
    public const TYPE_CODE             = "Code";
    public const TYPE_COLUMNS          = "Columns";
    public const TYPE_GLOBAL_BLOCK_REF = "GlobalBlockReference";
    public const TYPE_HEADING          = "Heading";
    public const TYPE_IMAGE            = "Image";
    public const TYPE_LISTING          = "Listing";
    public const TYPE_MENU             = "Menu";
    public const TYPE_PAGE_INFO        = "PageInfo";
    public const TYPE_PARAGRAPH        = "Paragraph";
    public const TYPE_RICH_TEXT        = "RichText";
    public const TYPE_SECTION          = "Section";
    public const TYPE_TEXT             = "Text";
    /** @var string self::TYPE_* */
    public string $type;
    /** @var ?string */
    public ?string $title;
    /** @var string e.g. "my-file", "site:my-file", "sivujetti:block-auto" */
    public string $renderer;
    /** @var string */
    public string $id;
    /** @var array array<int, {key: string, value: string}> */
    public array $propsData;
    /** @var string e.g. "j-Section-default j-Section-header" */
    public string $styleClasses;
    /** @var \Sivujetti\Block\Entities\Block[] */
    public array $children;

    /* If self::TYPE_BUTTON
    public string $html;
    public string $linkTo; e.g. "/my-page", "https://foo.com", "//foo.com"
    public string $tagType; "link"|"button"|"submit" */

    /* If self::TYPE_CODE
    public string $code; */

    /* If self::TYPE_COLUMNS
    public int $numColumns;
    public int $takeFullWidth; */

    /* If self::TYPE_TYPE_GLOBAL_BLOCK_REF
    public string $globalBlockTreeId;
    public string $overrides; @deprecated
    public int $useOverrides; @deprecated
    public ?\Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree $__globalBlockTree; */

    /* If self::TYPE_HEADING
    public string $text;
    public int $level; */

    /* If self::TYPE_IMAGE
    public string $src; */

    /* If "MyListing"
    public string $filterPageType; e.g. "Pages"
    public string $filterLimit; e.g. 10
    public string $filterLimitType; "all"|"single"|"atMost"
    public string $filterOrder; "desc"|"asc"|"rand"
    public string $filterAdditional; e.g. "{"slug":{"$startsWith":"foo"}}"
    public ?array $__pages; ?array<int, \Sivujetti\Page\Entities\Page>
    public ?\Sivujetti\PageType\Entities\PageType $__pageType; */

    /* If self::TYPE_MENU
    public string $tree;
    public string $wrapStart;
    public string $wrapEnd;
    public string $treeStart;
    public string $treeEnd;
    public string $itemStart;
    public string $itemAttrs;
    public string $itemEnd; */

    /* If self::TYPE_PARAGRAPH
    public string $text; */

    /* If self::TYPE_RICH_TEXT
    public string $html; */

    /* If self::TYPE_SECTION
    public string $bgImage; */

    /* If self::TYPE_TEXT
    public string $html; */

    /**
     * @param object $data
     * @return \Sivujetti\Block\Entities\Block
     */
    public static function fromObject(object $data): Block {
        $out = new Block;
        $out->type = $data->type;
        $out->title = $data->title;
        $out->renderer = $data->renderer;
        $out->id = $data->id;
        $out->propsData = $data->propsData;
        $out->styleClasses = $data->styleClasses ?? "";
        $out->children = [];
        foreach ($data->children as $child)
            $out->children[] = self::fromObject($child);
        foreach ($data->propsData as $field) {
            $out->{$field->key} = $field->value;
        }
        return $out;
    }
    /**
     * @param object $blueprint
     * @return \Sivujetti\Block\Entities\Block
     */
    public static function fromBlueprint(object $blueprint): Block {
        $out = new Block;
        $out->type = $blueprint->type;
        $out->title = $blueprint->title;
        $out->renderer = $blueprint->defaultRenderer;
        $out->id = PushIdGenerator::generatePushId();
        $out->propsData = [];
        $out->styleClasses = $blueprint->styleClasses ?? "";
        $out->children = [];
        foreach ($blueprint->children as $child)
            $out->children[] = self::fromBlueprint($child);
        foreach ($blueprint->initialData as $key => $value) {
            $out->propsData[] = (object) ["key" => $key, "value" => $value];
            $out->{$key} = $value;
        }
        return $out;
    }
}
