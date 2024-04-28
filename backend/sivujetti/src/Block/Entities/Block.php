<?php declare(strict_types=1);

namespace Sivujetti\Block\Entities;

use Sivujetti\{PushIdGenerator, ShortIdGenerator};

/**
 * @psalm-type stylesLayer = 'user-styles'|'dev-styles'|'todo'
 * @psalm-type mediaScope = 'all'|'960'|'840'|'600'|'480'|string
 * @psalm-type styleBlockScope = 'single-block'|'block-type'
 * @psalm-type StyleChunk = object{scss: string, scope: object{block: styleBlockScope, media: mediaScope, layer: stylesLayer}}
 * @psalm-type BlockBlueprint = object{blockType: string, initialOwnData: object, initialDefaultsData: object{title: string, renderer: string, styleClasses: string}, initialStyles: array<int, StyleChunk>, initialChildren: array<int, BlockBlueprint>}
 */
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
    public const TYPE_SECTION2         = "Section2";
    public const TYPE_TEXT             = "Text";
    public const TYPE_WRAPPER          = "Wrapper";
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
    public string $src;
    public string $altText;
    public string $caption; */

    /* If "MyListing"
    public string $filterPageType; e.g. "Pages"
    public string $filterLimit; e.g. 10
    public string $filterLimitType; "all"|"single"|"atMost"
    public string $filterOrder; "desc"|"asc"|"rand"
    public string $filterAdditional; Example: {slug: {$startsWith: "foo"}}
    public ?array $__pages; ?array<int, \Sivujetti\Page\Entities\Page>
    public ?\Sivujetti\PageType\Entities\PageType $__pageType; */

    /* If self::TYPE_MENU
    public array $tree; */

    /* If self::TYPE_PARAGRAPH
    public string $text; */

    /* If self::TYPE_RICH_TEXT
    public string $html; */

    /* If self::TYPE_SECTION
    public string $bgImage; */

    /* If self::TYPE_SECTION2
    public array<int, array<int, object{width: string, align: string|null, isVisible: boolean}>> $columns;
    public todo $settings; */

    /* If self::TYPE_TEXT
    public string $html; */

    /* If self::TYPE_WRAPPER
    public string $dummy; */

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
        if (!defined("USE_SHORT_IDS")) {
        $out->id = PushIdGenerator::generatePushId();
        } else {
        $out->id = ShortIdGenerator::generate();
        }
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
    /**
     * @param object $blueprint
     * @psalm-param BlockBlueprint $blueprint 
     * @param \Closure $onEach
     * @psalm-param \Closure(BlockBlueprint, Block): void $onEach
     * @return \Sivujetti\Block\Entities\Block
     */
    public static function fromBlueprint2(object $blueprint, \Closure $onEach): Block {
        $out = new Block;
        $defaults = $blueprint->initialDefaultsData;
        $out->type = $blueprint->blockType;
        $out->title = $defaults->title;
        $out->renderer = $defaults->renderer;
        $out->styleClasses = $defaults->styleClasses;
        if (!defined("USE_SHORT_IDS")) {
        $out->id = PushIdGenerator::generatePushId();
        } else {
        $out->id = ShortIdGenerator::generate();
        }

        $out->propsData = [];
        foreach ($blueprint->initialOwnData as $key => $value) {
            $out->propsData[] = (object) ["key" => $key, "value" => $value];
            $out->{$key} = $value;
        }

        $out->children = [];
        foreach ($blueprint->initialChildren as $child)
            $out->children[] = self::fromBlueprint2($child, $onEach);

        $onEach($blueprint, $out);
        return $out;
    }
}
