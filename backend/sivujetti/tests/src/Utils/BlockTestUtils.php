<?php declare(strict_types=1);

namespace Sivujetti\Tests\Utils;

use Sivujetti\Block\BlockTree;
use Sivujetti\Block\Entities\Block;

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
     * @param array<string, mixed>|null $propsData = null
     * @return object
     */
    public function makeBlockData(?string $type = null,
                                  ?string $title = null,
                                  ?string $renderer = null,
                                  ?array $children = null,
                                  ?array $propsData = null): object {
        $out = new \stdClass;
        $out->type = $type ?? Block::TYPE_PARAGRAPH;
        $out->title = $title ?? "";
        $out->renderer = $renderer ?? "sivujetti:block-auto";
        $out->id = "-bbbbbbbbbbbbbbbbbbb";
        $out->children = $children ?? [];
        $out->propsData = [];
        foreach ($propsData as $key => $value) {
            $out->propsData[] = (object) ["key" => $key, "value" => $value];
            $out->{$key} = $value;
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
}
