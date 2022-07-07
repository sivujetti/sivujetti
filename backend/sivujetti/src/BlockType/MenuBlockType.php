<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Sivujetti\Auth\ACL;

final class MenuBlockType implements BlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("tree", $builder::DATA_TYPE_TEXT)
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
