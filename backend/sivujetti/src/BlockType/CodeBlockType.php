<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Sivujetti\Auth\ACL;
use Sivujetti\ValidationUtils;

final class CodeBlockType implements BlockTypeInterface {
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
}
