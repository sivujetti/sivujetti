<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Sivujetti\Auth\ACL;
use Sivujetti\Page\WebPageAwareTemplate;
use Sivujetti\ValidationUtils;

use function Sivujetti\createElement as el;

final class CodeBlockType implements BlockTypeInterface, JsxLikeRenderingBlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("code")
                ->dataType(
                    $builder::DATA_TYPE_TEXT,
                    canBeEditedBy: ACL::ROLE_ADMIN|ACL::ROLE_ADMIN_EDITOR,
                    validationRules: [["maxLength", ValidationUtils::HARD_JSON_TEXT_MAX_LEN]]
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
            $block->code
                ? el("j-raw", [], $block->code) // @allow raw html/css/js
                : $tmpl->__("Waits for configuration ..."),
            // no children allowed
        );
    }
}
