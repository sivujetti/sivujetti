<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Sivujetti\Page\WebPageAwareTemplate;

use function Sivujetti\createElement as el;

class ColumnsBlockType implements BlockTypeInterface, JsxLikeRenderingBlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return self::addProperties($builder)->getResult();
    }
    /**
     */
    public static function addProperties(PropertiesBuilder $to): PropertiesBuilder {
        return $to
            ->newProperty("numColumns")->dataType($to::DATA_TYPE_UINT, isNullable: true)
            ->newProperty("takeFullWidth")->dataType($to::DATA_TYPE_UINT, isNullable: true);
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
}
