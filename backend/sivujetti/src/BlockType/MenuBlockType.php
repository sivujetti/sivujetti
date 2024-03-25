<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Sivujetti\Page\WebPageAwareTemplate;

use function Sivujetti\createElement as el;

/**
 * @psalm-type LinkTreeItem = {id: string, slug: string, text: string, children: array<int, LinkTreeItem>}
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
            ->newProperty("wrapEl", $builder::DATA_TYPE_TEXT)
            ->newProperty("treeEl", $builder::DATA_TYPE_TEXT)
            ->newProperty("treeItemEl", $builder::DATA_TYPE_TEXT)
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
            el("div", null,
                self::renderBranch($block->tree, $block, 0, $tmpl),
                ...$renderChildren()
            )
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
            ...array_map(fn($itm) => el(
                "li",
                array_merge(
                    ["class" => "level-{$depth}"],
                    $itm->slug === $currentPageSlug ? ["data-current" => "true"] : []
                ),
                el("a", ["href" => $tmpl->maybeExternalUrl($itm->slug)],
                    $itm->text
                ),
                $itm->children
                    ? self::renderBranch($itm->children, $block, $depth + 1, $tmpl)
                    : ""
            ), $branch)
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
