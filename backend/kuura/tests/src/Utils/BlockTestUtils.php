<?php declare(strict_types=1);

namespace KuuraCms\Tests\Utils;

use KuuraCms\Block\BlockTree;
use KuuraCms\Block\Entities\Block;

final class BlockTestUtils {
    /** @var ?\KuuraCms\Tests\Utils\PageTestUtils */
    private ?PageTestUtils $pageTestUtils;
    /**
     * @param ?\KuuraCms\Tests\Utils\PageTestUtils $pageTestUtils = null
     */
    public function __construct(?PageTestUtils $pageTestUtils = null) {
        $this->pageTestUtils = $pageTestUtils;
    }
    /**
     * @param ?string $type = null
     * @param ?string $title = null
     * @param ?string $renderer = null
     * @param object[]|null $children = null
     * @param array<string, mixed>|null $ownProps = null
     * @return object
     */
    public function makeBlockData(?string $type = null,
                                  ?string $title = null,
                                  ?string $renderer = null,
                                  ?array $children = null,
                                  ?array $ownProps = null): object {
        $out = new \stdClass;
        $out->type = $type ?? Block::TYPE_PARAGRAPH;
        $out->title = $title ?? "";
        $out->renderer = $renderer ?? "kuura:block-auto";
        $out->id = "-aaaaaaaaaaaaaaaaaaa";
        $out->children = $children ?? [];
        $out->props = [];
        foreach ($ownProps as $key => $value) {
            $out->props[] = (object) ["key" => $key, "value" => $value];
        }
        return $out;
    }
    /**
     * @param string $id
     * @param string $pageIDd
     * @param ?\KuuraCms\Block\Entities\Block
     */
    public function getBlock(string $id, string $pageId): ?Block {
        if (!($page = $this->pageTestUtils->getPageById($pageId)))
            return null;
        return BlockTree::findBlock($id, $page->blocks);
    }
}
