<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Sivujetti\Page\WebPageAwareTemplate;

/**
 * @phpstan-type VNode array{el: string, attrs: array<string, string>, children: list<VNode|string>}
 */
interface JsxLikeRenderingBlockTypeInterface {
    /**
     * @param object $block
     * @param \Closure(?string): (array<string, string>|null) $createDefaultProps
     * @param \Closure(): list<VNode|string> $renderChildren
     * @param \Sivujetti\Page\WebPageAwareTemplate $tmpl
     * @return VNode
     */
    public function render(object $block,
                           \Closure $createDefaultProps,
                           \Closure $renderChildren,
                           WebPageAwareTemplate $tmpl): array;
}
