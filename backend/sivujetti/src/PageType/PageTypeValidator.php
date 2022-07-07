<?php declare(strict_types=1);

namespace Sivujetti\PageType;

use Sivujetti\Block\BlockValidator;
use Sivujetti\Page\Entities\Page;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\ValidationUtils;
use Pike\{ObjectValidator, Validation};

final class PageTypeValidator {
    public const FIELD_DATA_TYPES = ["text", "json", "int", "uint", "many-to-many"];
    private const MAX_NAME_LEN = 64;
    private const MAX_FRIENDLY_NAME_LENGTH = 92;
    /** @var \Sivujetti\Block\BlockValidator */
    private BlockValidator $blockValidator;
    /**
     * @param \Sivujetti\Block\BlockValidator $blockValidator
     */
    public function __construct(BlockValidator $blockValidator) {
        $this->blockValidator = $blockValidator;
    }
    /**
     * @param object $input
     * @return string[] A list of error messages or []
     */
    public function validate(object $input): array {
        $validator = Validation::makeObjectValidator()
            ->rule("name", "identifier")
            ->rule("name", "maxLength", self::MAX_NAME_LEN)
            ->rule("slug", "regexp", ValidationUtils::SLUG_REGEXP_SIMPLE)
            ->rule("slug", "maxLength", ValidationUtils::SLUG_MAX_LENGTH)
            ->rule("friendlyName", "minLength", 1)
            ->rule("friendlyName", "maxLength", self::MAX_FRIENDLY_NAME_LENGTH)
            ->rule("friendlyNamePlural", "minLength", 1)
            ->rule("friendlyNamePlural", "maxLength", self::MAX_FRIENDLY_NAME_LENGTH)
            ->rule("description", "maxLength", ValidationUtils::HARD_SHORT_TEXT_MAX_LEN)
            ->rule("defaultLayoutId", "type", "string")
            ->rule("status", "in", [PageType::STATUS_COMPLETE, PageType::STATUS_DRAFT])
            ->rule("isListable", "type", "bool")
            //
            ->rule("ownFields", "type", "array")
            ->rule("ownFields.*.name", "identifier")
            ->rule("ownFields.*.name", "maxLength", self::MAX_NAME_LEN)
            ->rule("ownFields.*.friendlyName", "minLength", 1)
            ->rule("ownFields.*.friendlyName", "maxLength", self::MAX_FRIENDLY_NAME_LENGTH)
            ->rule("ownFields.*.dataType.type", "in", self::FIELD_DATA_TYPES)
            ->rule("ownFields.*.dataType.isNullable?", "type", "bool")
            ->rule("ownFields.*.dataType.length?", "type", "int")
            ->rule("ownFields.*.dataType.validationRules?", "type", "array")
            ->rule("ownFields.*.dataType.canBeEditedBy?", "type", "int")
            //->rule("ownFields.*.defaultValue") see below, "maxLength", ValidationUtils::HARD_LONG_TEXT_MAX_LEN)
            //
            ->rule("defaultFields.title.defaultValue", "maxLength", ValidationUtils::HARD_SHORT_TEXT_MAX_LEN);
        $errors = $validator->validate($input);
        if (!$errors) foreach ($input->ownFields as $i => $f) {
            if (property_exists($f, "defaultValue")) {
                $type = $f->dataType->type;
                if ($type === "many-to-many" &&
                    !Validation::is($f->defaultValue, "array"))
                    $errors[] = "ownFields.{$i}.dataType.defaultValue must be array";
                elseif ($type === "text" &&
                    !Validation::isLessOrEqualLength($f->defaultValue, ValidationUtils::HARD_LONG_TEXT_MAX_LEN))
                    $errors[] = "The length of ownFields.{$i}.dataType.defaultValue must be " .
                        ValidationUtils::HARD_LONG_TEXT_MAX_LEN . " or less";
                elseif ($type === "json" &&
                    !Validation::isLessOrEqualLength($f->defaultValue, ValidationUtils::HARD_JSON_TEXT_MAX_LEN))
                    $errors[] = "The length of ownFields.{$i}.dataType.defaultValue must be " .
                        ValidationUtils::HARD_LONG_TEXT_MAX_LEN . " or less";
                elseif (($type === "int" || $type === "uint") &&
                    !Validation::is($f->defaultValue, "int"))
                    $errors[] = "ownFields.{$i}.dataType.defaultValue must be integer";
            } else {
                $errors[] = "ownFields.{$i}.dataType.defaultValue is required";
            }
        }
        //
        return array_merge($errors,
                           $this->blockValidator->validateMany($input->blockFields));
    }
    /**
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     * @param object $input
     * @param bool $doValidateBlockTypes = false
     * @return string[] Error messages or []
     */
    public function validateInsertData(PageType $pageType,
                                       object $input,
                                       bool $doValidateBlockTypes = false): array {
        $v = ValidationUtils::addRulesForProperties($pageType->ownFields,
            self::withCommonRules(Validation::makeObjectValidator())
                ->rule("blocks", "type", "array")
        );
        if (!($errors = $v->validate($input)) && $doValidateBlockTypes)
            $errors = $this->blockValidator->validateMany($input->blocks);
        return $errors;
    }
    /**
     * @param \Sivujetti\PageType\Entities\PageType $pageType
     * @param object $input
     * @param bool $doValidateBlockTypes = false
     * @return string[] Error messages or []
     */
    public function validateUpdateData(PageType $pageType,
                                       object $input,
                                       bool $doValidateBlockTypes = false): array {
        $v = ValidationUtils::addRulesForProperties($pageType->ownFields,
            self::withCommonRules(Validation::makeObjectValidator())
        );
        if (!($errors = $v->validate($input)) && $doValidateBlockTypes)
            $errors = $this->blockValidator->validateMany($input->blocks);
        return $errors;
    }
    /**
     * @param \Pike\ObjectValidator $v
     * @return \Pike\ObjectValidator
     */
    private static function withCommonRules(ObjectValidator $v): ObjectValidator {
        return $v->addRuleImpl(...ValidationUtils::createUrlValidatorImpl())
            ->rule("id?", "type", "number")
            ->rule("slug", "pageUrl", ["allowExternal" => false])
            ->rule("path", "type", "string")
            ->rule("level", "type", "number")
            ->rule("title", "type", "string")
            ->rule("meta.description?", "type", "string")
            ->rule("meta.description?", "maxLength", 206) // Preferably 150 - 160
            ->rule("layoutId", "type", "number")
            ->rule("layoutId", "min", 1)
            ->rule("status", "type", "number")
            ->rule("status", "min", Page::STATUS_PUBLISHED);
    }
}
