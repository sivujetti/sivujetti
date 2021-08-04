<?php declare(strict_types=1);

namespace KuuraCms\Block;

use KuuraCms\BlockType\{BlockTypeInterface, PropertiesBuilder};
use KuuraCms\{SharedAPIContext, ValidationUtils};
use Pike\{PikeException, Validation};

final class BlockValidator {
    /** @var string[] */
    private array $validBlockRenderers;
    /** @var object */
    private object $blockTypes;
    /**
     * @param \KuuraCms\SharedAPIContext $storage
     */
    public function __construct(SharedAPIContext $storage) {
        $mixed = $storage->getDataHandle()->validBlockRenderers;
        // ["site:my-file",...] -> ["site:my-file","my-file",...]
        $withPrefs = array_filter($mixed, fn($fileId) => str_starts_with($fileId, "site:"));
        $withBoth = array_merge($mixed, array_map(fn($fileId) => explode(":", $fileId)[1], $withPrefs));
        $this->validBlockRenderers = $withBoth;
        //
        $this->blockTypes = $storage->getDataHandle()->blockTypes;
    }
    /**
     * @param \KuuraCms\BlockType\BlockTypeInterface|string $blockType
     * @param object $input
     * @return string[] Error messages or []
     * @throws \Pike\PikeException If $blockType (string) wasn't valid
     */
    public  function validateInsertOrUpdateData(BlockTypeInterface|string $blockType,
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
                ->rule("title", "type", "string")
                ->rule("title", "maxLength", ValidationUtils::HARD_SHORT_TEXT_MAX_LEN)
                ->rule("renderer", "in", $this->validBlockRenderers)
                ->rule("id", "minLength", 20)
                ->rule("id", "maxLength", 20)
        )->validate($input);
    }
}
