<?php declare(strict_types=1);

namespace Sivujetti\PageType;

use Sivujetti\Block\BlockValidator;
use Sivujetti\Page\Entities\Page;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\ValidationUtils;
use Pike\{Validation};

final class PageTypeValidator {
    public const FIELD_DATA_TYPES = ["text", "json", "int", "uint"];
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
            ->rule("isListable", "type", "bool")
            ->rule("ownFields", "type", "array")
            ->rule("ownFields.*.name", "identifier")
            ->rule("ownFields.*.name", "maxLength", self::MAX_NAME_LEN)
            ->rule("ownFields.*.friendlyName", "minLength", 1)
            ->rule("ownFields.*.friendlyName", "maxLength", self::MAX_FRIENDLY_NAME_LENGTH)
            ->rule("ownFields.*.dataType.type", "in", self::FIELD_DATA_TYPES)
            ->rule("ownFields.*.dataType.length?", "type", "int")
            ->rule("ownFields.*.dataType.validationRules?", "type", "array")
            ->rule("ownFields.*.defaultValue", "maxLength", ValidationUtils::HARD_LONG_TEXT_MAX_LEN)
            ->rule("ownFields.*.isNullable", "type", "bool");
        //
        $errors3 = is_object($input->defaultFields) &&
            $input->defaultFields->title?->defaultValue === "<my type>'s title"
            ? []
            : ["Invalid defaultFields"];
        //
        $errors4 = $this->blockValidator->validateMany($input->blockFields);
        //
        return array_merge($validator->validate($input),
                           $errors3,
                           $errors4);
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
            Validation::makeObjectValidator()
                ->rule("slug", "type", "string")
                ->rule("path", "type", "string")
                ->rule("level", "type", "number")
                ->rule("title", "type", "string")
                ->rule("layoutId", "type", "number")
                ->rule("layoutId", "min", 1)
                ->rule("blocks", "type", "array")
                ->rule("status", "type", "number")
                ->rule("status", "min", Page::STATUS_PUBLISHED)
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
            Validation::makeObjectValidator()
                ->rule("slug", "type", "string")
                ->rule("path", "type", "string")
                ->rule("level", "type", "number")
                ->rule("title", "type", "string")
                ->rule("layoutId", "type", "number")
                ->rule("layoutId", "min", 1)
                ->rule("status", "type", "number")
                ->rule("status", "min", Page::STATUS_PUBLISHED)
        );
        if (!($errors = $v->validate($input)) && $doValidateBlockTypes)
            $errors = $this->blockValidator->validateMany($input->blocks);
        return $errors;
    }
    /**
     * @param object $input
     * @return string[] Error messages or []
     */
    public function validateBlocksUpdateData(object $input): array {
        if (($errors = Validation::makeObjectValidator()
            ->rule("blocks", "minLength", "1", "array")
            ->validate($input))) {
            return $errors;
        }
        return $this->blockValidator->validateMany($input->blocks);
    }
}
