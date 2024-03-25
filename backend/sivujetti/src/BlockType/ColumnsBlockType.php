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
            ->newProperty("numColumns", $to::DATA_TYPE_UINT)
            ->newProperty("takeFullWidth", $to::DATA_TYPE_UINT);
    }
    /**
     * @inheritdoc
     */
    public function render(object $block,
                           \Closure $createDefaultProps,
                           \Closure $renderChildren,
                           WebPageAwareTemplate $tmpl): array {
        $extraClasses = (
            "num-cols-" . ((int) $block->numColumns) .
            ($block->takeFullWidth ? "" : " inline")
        );
        return el("div", $createDefaultProps($extraClasses),
            ...$renderChildren()
        );
    }
}
