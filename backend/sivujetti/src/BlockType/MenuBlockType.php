<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Sivujetti\Page\WebPageAwareTemplate;

use function Sivujetti\createElement as el;

/**
 * @psalm-type LinkTreeItem = {id: string, slug: string, text: string, children: array<int, LinkTreeItem>, includeToggleButton?: bool}
 * @psalm-import-type VNode from Sivujetti\BlockType\JsxLikeRenderingBlockTypeInterface
 */
final class MenuBlockType implements BlockTypeInterface, JsxLikeRenderingBlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("tree")->dataType(
                $builder::DATA_TYPE_ARRAY,
                sanitizeWith: self::createLinkTree(...)
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
        return el("nav", $createDefaultProps(),
            self::renderBranch($block->tree, $block, 0, $tmpl),
            ...$renderChildren()
        );
    }
    /**
     * @param array $branch
     * @param object $block
     * @param int $depth
     * @param \Sivujetti\Page\WebPageAwareTemplate $tmpl
     * @return array
     * @psalm-return VNode
     */
    private static function renderBranch(array $branch, object $block, int $depth, WebPageAwareTemplate $tmpl): array {
        $currentPageSlug = $tmpl->getLocal("currentUrl");
        return el("ul", ["class" => "level-{$depth}"],
            ...array_map(function($itm) use ($currentPageSlug, $depth, $tmpl, $block) {
                $hasChildrenCls = !$itm->children ? "" : " has-children";
                return el(
                    "li",
                    [
                        "class" => "level-{$depth}{$hasChildrenCls}",
                        ...($itm->slug === $currentPageSlug ? ["data-current" => "true"] : [])
                    ],
                    el("a", ["href" => $tmpl->maybeExternalUrl($itm->slug)],
                        $itm->text
                    ),
                    $hasChildrenCls
                        ? [
                            ...(!($itm->includeToggleButton ?? null) ? [] : [el("button",
                                [
                                    "onclick" => "event.target.closest('li').classList.toggle('li-open')",
                                    "class" => "btn btn-link btn-sub-nav-toggle",
                                ],
                                el("svg", [
                                    "xmlns" => "http://www.w3.org/2000/svg",
                                    "class" => "icon icon-tabler",
                                    "width" => "24", "height" => "24",
                                    "viewBox" => "0 0 24 24",
                                    "stroke-width" => "2",
                                    "stroke" => "currentColor",
                                    "fill" => "none",
                                    "stroke-linecap" => "round",
                                    "stroke-linejoin" => "round",
                                ], "<path stroke=\"none\" d=\"M0 0h24v24H0z\" fill=\"none\"></path><polyline points=\"6 9 12 15 18 9\"></polyline>")
                            )]),
                            self::renderBranch($itm->children, $block, $depth + 1, $tmpl)
                        ]
                        : ""
                );
            }, $branch)
        );
    }
    /**
     * @param object $obj
     * @return object
     * @psalm-return LinkTreeItem
     */
    private static function objToTreeItem(object $obj): object {
        return (object) [
            "id" => strval($obj->id),
            "slug" => strval($obj->slug),
            "text" => strval($obj->text),
            ...(($obj->includeToggleButton ?? null) ? ["includeToggleButton" => true] : []),
            "children" => $obj->children ? self::createLinkTree($obj->children) : [],
        ];
    }
    /**
     * @param array $input
     * @psalm-param array<int, object> $input
     * @return array
     * @psalm-return array<int, LinkTreeItem>
     */
    private static function createLinkTree(array $input): array {
        return array_map(self::objToTreeItem(...), $input);
    }
}
