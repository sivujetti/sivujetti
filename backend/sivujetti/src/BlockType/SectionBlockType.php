<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Sivujetti\Page\WebPageAwareTemplate;

use function Sivujetti\createElement as el;

class SectionBlockType implements BlockTypeInterface, JsxLikeRenderingBlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("bgImage")
                ->dataType($builder::DATA_TYPE_TEXT, validationRules: [
                    ["notContains", "./", "string"],
                ])
            ->getResult();
    }
    /**
     * @inheritdoc
     */
    public function render(object $block,
                           \Closure $createDefaultProps,
                           \Closure $renderChildren,
                           WebPageAwareTemplate $tmpl): array {
        return el("section",
            [
                ...$createDefaultProps(),
                ...($block->bgImage ? ["style" => "background-image:url('{$tmpl->maybeExternalMediaUrl($block->bgImage)}')"] : [])
            ],
            el("div", ["data-block-root" => ""],
                ...$renderChildren()
            )
        );
    }
}
