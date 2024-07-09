<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Sivujetti\Page\WebPageAwareTemplate;

use function Sivujetti\createElement as el;

class Section2BlockType implements BlockTypeInterface, JsxLikeRenderingBlockTypeInterface {
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
        return el("div", $createDefaultProps(),
            el("div", ["class" => "j-Section2-cols"],
                ...$renderChildren()
            )
        );
    }
    /**
     * @param \Sivujetti\BlockType\PropertiesBuilder $to
     * @return \Sivujetti\BlockType\PropertiesBuilder
     */
    protected function addDefaultProperties(PropertiesBuilder $to): PropertiesBuilder {
        return $to
            ->newProperty("settings")->dataType(
                $to::DATA_TYPE_OBJECT,
                sanitizeWith: fn(object $obj) => (object) [
                    "innerBg" => $obj->innerBg ? strval($obj->innerBg) : null,
                    "outerBg" => $obj->outerBg ? strval($obj->outerBg) : null,
                ]
            );
    }
}
