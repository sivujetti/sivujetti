<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Sivujetti\Page\WebPageAwareTemplate;

use function Sivujetti\createElement as el;

class ColumnsBlockType implements BlockTypeInterface, JsxLikeRenderingBlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $this->addDefaultProperties($builder)->getResult();
    }
    /**
     * @inheritdoc
     */
    public function render(object $block,
                           \Closure $createDefaultProps,
                           \Closure $renderChildren,
                           WebPageAwareTemplate $tmpl): array {
        $numCols = $block->numColumns ?? null;
        $extraClasses = implode(" ", [
            ...($numCols ? ["num-cols-" . ((int) $numCols)] : []),
            ...($block->takeFullWidth === false ? ["inline"] : []),
        ]);
        return el("div", $createDefaultProps($extraClasses),
            ...$renderChildren()
        );
    }
    /**
     * @param \Sivujetti\BlockType\PropertiesBuilder $to
     * @return \Sivujetti\BlockType\PropertiesBuilder
     */
    protected function addDefaultProperties(PropertiesBuilder $to): PropertiesBuilder {
        return $to
            ->newProperty("numColumns")->dataType($to::DATA_TYPE_UINT, isNullable: true)
            ->newProperty("takeFullWidth")->dataType($to::DATA_TYPE_UINT, isNullable: true);
    }
}
