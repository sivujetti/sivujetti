<?php declare(strict_types=1);

namespace KuuraCms\Block;

use KuuraCms\BlockType\{BlockTypeInterface, PropertiesBuilder};
use KuuraCms\{SharedAPIContext, ValidationUtils};
use Pike\Validation;

final class BlockValidator {
    /** @var string[] */
    private array $validBlockRenderers;
    /**
     * @param \KuuraCms\SharedAPIContext $storage
     */
    public function __construct(SharedAPIContext $storage) {
        $mixed = $storage->getDataHandle()->validBlockRenderers;
        // ["site:my-file",...] -> ["site:my-file","my-file",...]
        $withPrefs = array_filter($mixed, fn($fileId) => str_starts_with($fileId, "site:"));
        $withBoth = array_merge($mixed, array_map(fn($fileId) => explode(":", $fileId)[1], $withPrefs));
        $this->validBlockRenderers = $withBoth;
    }
    /**
     * @param \KuuraCms\BlockType\BlockTypeInterface $blockType 
     * @param object $input
     * @return string[] Error messages or []
     */
    public  function validateInsertOrUpdateData(BlockTypeInterface $blockType,
                                                object $input): array {
        return ValidationUtils::addRulesForProperties(
            $blockType->defineProperties(new PropertiesBuilder),
            Validation::makeObjectValidator()
                ->rule("title", "type", "string")
                ->rule("title", "maxLength", ValidationUtils::HARD_SHORT_TEXT_MAX_LEN)
                ->rule("renderer", "in", $this->validBlockRenderers)
                ->rule("id", "minLength", 20)
                ->rule("id", "maxLength", 20)
        )->validate($input);
    }
}
