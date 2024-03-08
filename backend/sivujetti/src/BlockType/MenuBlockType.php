<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Sivujetti\Auth\ACL;
use Sivujetti\Page\WebPageAwareTemplate;
use Sivujetti\ValidationUtils;

use function Sivujetti\createElement as el;

/**
 * @psalm-import-type VNode from Sivujetti\BlockType\JsxLikeRenderingBlockTypeInterface
 */
final class MenuBlockType implements BlockTypeInterface, JsxLikeRenderingBlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("tree")->dataType($builder::DATA_TYPE_TEXT, validationRules: [
                ["maxLength", ValidationUtils::HARD_LONG_TEXT_MAX_LEN]
            ])
            ->newProperty("wrapStart")->dataType($builder::DATA_TYPE_TEXT, canBeEditedBy: ACL::ROLE_ADMIN)
            ->newProperty("wrapEnd")->dataType($builder::DATA_TYPE_TEXT, canBeEditedBy: ACL::ROLE_ADMIN)
            ->newProperty("treeStart")->dataType($builder::DATA_TYPE_TEXT, canBeEditedBy: ACL::ROLE_ADMIN)
            ->newProperty("treeEnd")->dataType($builder::DATA_TYPE_TEXT, canBeEditedBy: ACL::ROLE_ADMIN)
            ->newProperty("itemStart")->dataType($builder::DATA_TYPE_TEXT, canBeEditedBy: ACL::ROLE_ADMIN)
            ->newProperty("itemAttrs")->dataType($builder::DATA_TYPE_TEXT, canBeEditedBy: ACL::ROLE_ADMIN)
            ->newProperty("itemEnd")->dataType($builder::DATA_TYPE_TEXT, canBeEditedBy: ACL::ROLE_ADMIN)
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
                self::renderBranch(json_decode($block->tree), $block, 0, $tmpl),
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
        $currentPageSlug = $tmpl->currentUrl;
        return el("ul", ["class" => "level-{$depth}"],
            ...array_map(fn ($itm) => el(
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
}
