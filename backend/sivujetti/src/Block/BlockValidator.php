<?php declare(strict_types=1);

namespace Sivujetti\Block;

use Sivujetti\BlockType\{BlockTypeInterface, PropertiesBuilder};
use Sivujetti\{SharedAPIContext, ValidationUtils};
use Pike\{PikeException, Validation};

final class BlockValidator {
    /** @var string[] */
    private array $validBlockRenderers;
    /** @var object */
    private object $blockTypes;
    /**
     * @param \Sivujetti\SharedAPIContext $apiCtx
     */
    public function __construct(SharedAPIContext $apiCtx) {
        $expandedFileIds = [];
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
        return ValidationUtils::addRulesForProperties(
            $blockTypeFinal->defineProperties(new PropertiesBuilder),
            Validation::makeObjectValidator()
                ->addRuleImpl(...ValidationUtils::createPushIdValidatorImpl())
                ->addRuleImpl(...ValidationUtils::createUrlValidatorImpl())
                ->rule("title", "type", "string")
                ->rule("title", "maxLength", ValidationUtils::HARD_SHORT_TEXT_MAX_LEN)
                ->rule("renderer", "in", $this->validBlockRenderers)
                ->rule("id", "pushId")
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
}
