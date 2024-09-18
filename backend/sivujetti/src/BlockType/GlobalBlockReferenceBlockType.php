<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Pike\Injector;
use Sivujetti\Block\Entities\Block;
use Sivujetti\GlobalBlockTree\GlobalBlockTreesRepository;

final class GlobalBlockReferenceBlockType implements BlockTypeInterface,
                                                     RenderAwareBlockTypeInterface {
    public const EMPTY_OVERRIDES = "{}";
    /** @var array<int, \Sivujetti\GlobalBlockTree\Entities\GlobalBlockTree|null> */
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
        self::$trees[$gbtId] = $entry;
    }
}
