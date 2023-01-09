<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Sivujetti\Auth\ACL;
use Sivujetti\ValidationUtils;

final class MenuBlockType implements BlockTypeInterface {
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
}
