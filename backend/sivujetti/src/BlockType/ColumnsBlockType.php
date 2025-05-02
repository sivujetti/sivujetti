<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Sivujetti\Page\WebPageAwareTemplate;

use function Sivujetti\createElement as el;

class ColumnsBlockType implements BlockTypeInterface, JsxLikeRenderingBlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("numColumns")->dataType($builder::DATA_TYPE_UINT, isNullable: true)
            ->newProperty("isRow")->dataType($builder::DATA_TYPE_UINT)
            ->newProperty("config")->dataType(
                $builder::DATA_TYPE_OBJECT,
                sanitizeWith: fn(object $obj) => $obj // todo
            )
            ->getResult();
    }
    /**
     * @inheritdoc
     */
    public function render(object $block,
                           \Closure $createDefaultProps,
                           \Closure $renderChildren,
                           WebPageAwareTemplate $tmpl): array {
        $numCols = $block->numColumns ?? 1;
        $extraClasses = implode(" ", [
            ...(($block->isRow ?? null) ? ["is-row"] : []),
            ...($numCols > 1 ? ["num-cols-" . ((int) $numCols)] : []),
            ...(($block->config->takeFullWidth ?? null) === 0 ? ["d-inline-grid"] : []),
            ...(($block->config->alignY ?? null) === "center" ? ["align-center"] : []),
        ]);
        return el("div", $createDefaultProps($extraClasses),
            ...$renderChildren()
        );
    }
}
