<?php declare(strict_types=1);

namespace Sivujetti\Tests\Utils;

use Sivujetti\Block\Entities\Block;
use Sivujetti\PushIdGenerator;

/**
 * @x-psalm-type RawBlock = object{type: string, title: string, renderer: string, id: string, children: array<int, object>, propsData: array<int, object{key: string, value: mixed}>}
 * @x-psalm-type RawGlobalBlockTree = object{id: string, name: string, block: array<int, RawBlock>}
 * @x-psalm-type RawGlobalBlockStyles = object{id: string, styles: string, globalBlockTreeId: string}
 */
final class GlobalBlockTreeTestUtils {
    /** @var \Sivujetti\Tests\Utils\BlockTestUtils */
    private BlockTestUtils $blockTestUtils;
    /**
     * @param \Sivujetti\Tests\Utils\BlockTestUtils $blockTestUtils = null
     */
    public function __construct(BlockTestUtils $blockTestUtils = null) {
        $this->blockTestUtils = $blockTestUtils;
    }
    /**
     * @return object RawGlobalBlockTree
     */
    public function makeGlobalBlockTreeData(): object {
        $btu = $this->blockTestUtils;
        return (object) [
            "id" => PushIdGenerator::generatePushId(),
            "name" => "My footer",
            "blocks" => [$btu->makeBlockData(Block::TYPE_SECTION, "Footer", "sivujetti:block-generic-wrapper", children: [
                $btu->makeBlockData(Block::TYPE_PARAGRAPH, propsData: ["text" => "© Year My Site"]),
            ], propsData: ["bgImage" => ""])]
        ];
    }
    /**
     * @param object $globalBlockTree See $this->makeGlobalBlockTreeData()
     * @param string $themeId
     * @return object RawGlobalBlockStyles
     */
    public function makeGlobalBlockStylesData(object $globalBlockTree, string $themeId): object {
        $sectionBlock = $globalBlockTree->blocks[0];
        return (object) [
            "id" => "@later",
            "styles" => json_encode([(object) ["blockId" => $sectionBlock->id, "styles" => "{ color: red; }"]]),
            "globalBlockTreeId" => $globalBlockTree->id,
            "themeId" => $themeId,
        ];
    }
}
