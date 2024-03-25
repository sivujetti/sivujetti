<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Sivujetti\Auth\ACL;
use Sivujetti\Page\WebPageAwareTemplate;

use function Sivujetti\createElement as el;

final class ButtonBlockType implements BlockTypeInterface {
    public const TAG_TYPE_LINK = "link";
    public const TAG_TYPE_NORMAL_BUTTON = "button";
    public const TAG_TYPE_SUBMIT_BUTTON = "submit";
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("html", $builder::DATA_TYPE_TEXT)
            ->newProperty("linkTo")->dataType($builder::DATA_TYPE_TEXT, isNullable: true, validationRules: [
                ["pageUrl", ["allowExternal" => true]]
            ])
            ->newProperty("tagType")->dataType($builder::DATA_TYPE_TEXT, validationRules: [
                ["in", [self::TAG_TYPE_LINK, self::TAG_TYPE_NORMAL_BUTTON, self::TAG_TYPE_SUBMIT_BUTTON]]
            ], canBeEditedBy: ACL::ROLE_ADMIN|ACL::ROLE_ADMIN_EDITOR)
            ->getResult();
    }
    /**
     * @inheritdoc
     */
    public function render(object $block,
                           \Closure $createDefaultProps, 
                           \Closure $renderChildren,
                           WebPageAwareTemplate $tmpl): array {
        [$el, $attrs] = $block->tagType !== "link"
            ? ["button", ["type" => $block->tagType]]
            : ["a",      ["href" => $tmpl->maybeExternalUrl($block->linkTo)]];
        return el($el, [...$createDefaultProps("btn"), ...$attrs],
            el(":raw", [], $block->html), // @allow pre-validated html
            ...$renderChildren()
        );
    }
}
