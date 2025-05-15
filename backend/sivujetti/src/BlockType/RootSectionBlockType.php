<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Sivujetti\Page\WebPageAwareTemplate;

use function Sivujetti\createElement as el;

class RootSectionBlockType implements BlockTypeInterface, JsxLikeRenderingBlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
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
        $cf = $block->config->dataCreatedFrom ?? null;
        return el("div", [...$createDefaultProps(), ...($cf ? ["data-created-from" => $cf] : [])],
            ...$renderChildren()
        );
    }
}
