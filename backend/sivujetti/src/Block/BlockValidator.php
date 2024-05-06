<?php declare(strict_types=1);

namespace Sivujetti\Block;

use Sivujetti\BlockType\{BlockTypeInterface, PropertiesBuilder};
use Sivujetti\{SharedAPIContext, ValidationUtils};
use Pike\{PikeException, Validation};
use Pike\Validation\ObjectValidator;

final class BlockValidator {
    /** @var string[] */
    private array $validBlockRenderers;
    /** @var object */
    private object $blockTypes;
    /**
     * @param \Sivujetti\SharedAPIContext $apiCtx
     */
    public function __construct(SharedAPIContext $apiCtx) {
        $expandedFileIds = ["jsx"];
        foreach ($apiCtx->blockRenderers as $renderer) {
            $fileId = $renderer["fileId"];
            $expandedFileIds[] = $fileId;
            if (str_starts_with($fileId, "site:")) $expandedFileIds[] = explode(":", $fileId)[1];
        }
        $this->validBlockRenderers = $expandedFileIds;
        $this->blockTypes = $apiCtx->blockTypes;
    }
    /**
     * @param \Sivujetti\BlockType\BlockTypeInterface|string $blockType
     * @param object $input
     * @return string[] Error messages or []
     * @throws \Pike\PikeException If $blockType (string) wasn't valid
     */
    public function validateInsertOrUpdateData(BlockTypeInterface|string $blockType,
                                               object $input): array {
        if (is_string($blockType)) {
            if (!($blockTypeFinal = $this->blockTypes->{$blockType} ?? null))
                throw new PikeException("Unknown block type `{$blockType}`",
                                        PikeException::BAD_INPUT);
        } else {
            $blockTypeFinal = $blockType;
        }
        $v = $this->addRulesForDefaultProps(
            Validation::makeObjectValidator()
                ->addRuleImpl(...ValidationUtils::createPushIdValidatorImpl())
                ->addRuleImpl(...ValidationUtils::createUrlValidatorImpl())
        );
        return ValidationUtils::addRulesForProperties(
            $blockTypeFinal->defineProperties(new PropertiesBuilder),
            $v->rule("id", "type", "string")->rule("id", "pushId")
        )->validate($input);
    }
    /**
     * @param object[] $branch
     * @return string[] Error messages or e[]
     */
    public function validateMany(array $branch): array {
        foreach ($branch as $blockData) {
            if (($errors = $this->validateInsertOrUpdateData($blockData->type, $blockData)))
                return $errors;
            if ($blockData->children && ($errors = $this->validateMany($blockData->children)))
                return $errors;
        }
        return [];
    }
    /**
     * @param \Pike\Validation\ObjectValidator $validator
     * @param string $pathPrefix = ""
     * @return \Pike\Validation\ObjectValidator
     */
    public function addRulesForDefaultProps(ObjectValidator $validator, string $pathPrefix = ""): ObjectValidator {
        return $validator
            ->rule("{$pathPrefix}title", "type", "string")
            ->rule("{$pathPrefix}title", "maxLength", ValidationUtils::HARD_SHORT_TEXT_MAX_LEN)
            ->rule("{$pathPrefix}renderer", "in", $this->validBlockRenderers)
            ->rule("{$pathPrefix}styleClasses", "type", "string")
            ->rule("{$pathPrefix}styleClasses", "maxLength", ValidationUtils::HARD_SHORT_TEXT_MAX_LEN)
            ->rule("{$pathPrefix}styleGroup", "type", "string")
            ->rule("{$pathPrefix}styleGroup", "maxLength", ValidationUtils::HARD_SHORT_TEXT_MAX_LEN);
    }
    /**
     * @return string[]
     */
    public function getValidBlockTypeNames(): array {
        return array_keys(get_object_vars($this->blockTypes));
    }
    /**
     * @return string[]
     */
    public function getValidBlockRenderers(): array {
        return $this->validBlockRenderers;
    }
}
