<?php declare(strict_types=1);

namespace Sivujetti\Tests\Utils;

use Sivujetti\Block\BlockTree;
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\ButtonBlockType;
use Sivujetti\{PushIdGenerator, Template};

final class BlockTestUtils {
    /** @var ?\Sivujetti\Tests\Utils\PageTestUtils */
    private ?PageTestUtils $pageTestUtils;
    /**
     * @param ?\Sivujetti\Tests\Utils\PageTestUtils $pageTestUtils = null
     */
    public function __construct(?PageTestUtils $pageTestUtils = null) {
        $this->pageTestUtils = $pageTestUtils;
    }
    /**
     * @param ?string $type = null
     * @param ?string $title = null
     * @param ?string $renderer = null
     * @param object[]|null $children = null
     * @param array<string, mixed>|object|null $propsData = null
     * @param ?string $id = null
     * @return object
     */
    public function makeBlockData(?string $type = null,
                                  ?string $title = null,
                                  ?string $renderer = null,
                                  ?array $children = null,
                                  array|object|null $propsData = null,
                                  ?string $id = null): object {
        $out = new \stdClass;
        $out->type = $type ?? Block::TYPE_PARAGRAPH;
        $out->title = $title ?? "";
        $out->renderer = $renderer ?? "sivujetti:block-auto";
        $out->id = match ($id) {
            "@auto" => PushIdGenerator::generatePushId(),
            null => "-bbbbbbbbbbbbbbbbbbb",
            default => $id
        };
        $out->children = $children ?? [];
        $out->propsData = [];
        if ($propsData) {
            foreach ($propsData as $key => $value) {
                $out->propsData[] = (object) ["key" => $key, "value" => $value];
                $out->{$key} = $value;
            }
        }
        return $out;
    }
    /**
     * @param string $id
     * @param string $pageIDd
     * @param ?\Sivujetti\Block\Entities\Block
     */
    public function getBlock(string $id, string $pageId): ?Block {
        if (!($page = $this->pageTestUtils->getPageById($pageId)))
            return null;
        return BlockTree::findBlockById($id, $page->blocks);
    }
    /**
     * @param object $rawBlock An object returned by $this->makeBlockData()
     * @param string $html
     * @return string
     */
    public static function decorateWithRef(object $rawBlock, string $html): string {
        return "<!-- block-start {$rawBlock->id}:{$rawBlock->type} -->{$html}<!-- block-end {$rawBlock->id} -->";
    }
    /**
     * @param object $rawBlock
     * @param ?string $lnk = null
     * @param ?string $cls = null
     * @param string $childMarker = ""
     */
    public function getExpectedButtonBlockOutput(object $rawBlock,
                                                 ?string $lnk = null,
                                                 ?string $cls = null,
                                                 string $childMarker = ""): string {
        if ($lnk === null) $lnk = Template::makeUrl($rawBlock->linkTo);
        if ($cls === null) $cls = !$rawBlock->cssClass ? "" : (" " . Template::e($rawBlock->cssClass));
        [$start, $end] = match ($rawBlock->tagType) {
            ButtonBlockType::TAG_TYPE_NORMAL_BUTTON => ["<button type=\"button\"", "</button>"],
            ButtonBlockType::TAG_TYPE_SUBMIT_BUTTON => ["<button type=\"submit\"", "</button>"],
            default => ["<a href=\"{$lnk}\"", "</a>"],
        };
        return "<p class=\"button\">" .
            "{$start} class=\"btn{$cls}\" data-block-root>" .
                "{$rawBlock->html}{$childMarker}" .
            $end .
        "</p>";
    }
}
