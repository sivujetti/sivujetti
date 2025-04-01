<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Pike\Injector;
use Sivujetti\Block\Entities\Block;
use Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree;
use Sivujetti\GlobalBlockTree\GlobalBlockTreesRepository;

class GlobalBlockReferenceBlockType implements BlockTypeInterface, RenderAwareBlockTypeInterface {
    public const EMPTY_OVERRIDES = "{}";
    /** @var array<string, \Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree> */
    private static array $trees = [];
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("globalBlockTreeId", $builder::DATA_TYPE_TEXT)
            ->newProperty("overrides", $builder::DATA_TYPE_TEXT)
            ->newProperty("useOverrides", $builder::DATA_TYPE_UINT)
            ->getResult();
    }
    /**
     * @inheritdoc
     */
    public function onBeforeRender(Block $block,
                                   BlockTypeInterface $blockType,
                                   Injector $di): void {
        $gbtId = $block->globalBlockTreeId;
        if (!array_key_exists($gbtId, self::$trees))
            $di->execute($this->fetchAndCacheGbt(...), [":gbtId" => $gbtId]);
        $block->__globalBlockTree = self::$trees[$gbtId];
    }
    /**
     * @param string $gbtId
     * @param \Sivujetti\GlobalBlockTree\GlobalBlockTreesRepository $gbtRepo
     */
    public function fetchAndCacheGbt(string $gbtId,
                                     GlobalBlockTreesRepository $gbtRepo): void {
        $entry = $gbtRepo->getSingle($gbtId);
        self::$trees[$gbtId] = $entry ?? self::createBrokenGbt($gbtId);
    }
    /**
     * @param string $gbtId
     * @return \Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree
     */
    private static function createBrokenGbt(string $gbtId): GlobalBlockTree {
        $out = new GlobalBlockTree;
        $out->id = $gbtId;
        $out->name = "-";
        $out->blocks = [Block::fromObject((object) [
            "type" => "Text",
            "title" => "?",
            "renderer" => "jsx",
            "id" => "?",
            "propsData" => [(object) ["key" => "html", "value" => "Content not found"]],
            "styleClasses" => "",
            "children" => [],
        ])];
        return $out;
    }
}
