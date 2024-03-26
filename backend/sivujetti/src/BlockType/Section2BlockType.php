<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Sivujetti\Page\WebPageAwareTemplate;

use function Sivujetti\createElement as el;

class Section2BlockType implements BlockTypeInterface, JsxLikeRenderingBlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("columns")->dataType(
                $builder::DATA_TYPE_ARRAY,
                sanitizeWith: fn(array $in) => array_map(fn(?array $screenSize) =>
                    $screenSize
                        ? array_map(fn(object $obj) => (object) [
                            "align" => $obj->align ? strval($obj->align) : null,
                            "width" => strval($obj->width),
                            "isVisible" => !!$obj->isVisible,
                        ], $screenSize)
                        : null
                , $in)
            )
            ->newProperty("settings")->dataType(
                $builder::DATA_TYPE_OBJECT,
                sanitizeWith: fn(object $obj) => (object) [
                    "innerBg" => $obj->innerBg ? strval($obj->innerBg) : null,
                    "outerBg" => $obj->outerBg ? strval($obj->outerBg) : null,
                ]
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
        return el("div", $createDefaultProps(),
            el("div", ["class" => "j-Section2-cols"],
                ...$renderChildren()
            )
        );
    }
}