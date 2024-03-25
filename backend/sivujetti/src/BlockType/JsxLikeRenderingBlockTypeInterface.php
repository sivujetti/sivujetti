<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Sivujetti\Page\WebPageAwareTemplate;

/**
 * @psalm-type VNode = array{el: string, attrs: array<string, string>, children: array<int, VNode|string>}
 */
interface JsxLikeRenderingBlockTypeInterface {
    /**
     * @param object $block
     * @param \Closure $createDefaultProps
     * @param \Closure $renderChildren
     * @param \Sivujetti\Page\WebPageAwareTemplate $tmpl
     * @return array
     * @psalm-return VNode
     */
    public function render(object $block,
                           \Closure $createDefaultProps,
                           \Closure $renderChildren,
                           WebPageAwareTemplate $tmpl): array;
}
