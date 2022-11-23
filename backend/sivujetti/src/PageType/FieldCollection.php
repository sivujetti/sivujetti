<?php declare(strict_types=1);

namespace Sivujetti\PageType;

use Sivujetti\PageType\Entities\Field;

/**
 * PageType->fields, ArrayObject<\Sivujetti\PageType\Entities\Field>.
 *
 * @psalm-import-type RawPageTypeField from \Sivujetti\PageType\Entities\Field
 */
class FieldCollection extends \ArrayObject implements \JsonSerializable {
    /**
     * @param \Closure $formatterFn = null fn(\Sivujetti\PageType\Entities\Field $field): string
     * @param string[] $onlyThese = []
     * @return string "`name`, `name2`"
     */
    public function toSqlCols(\Closure $formatterFn = null,
                              array $onlyThese = []): string {
        $names = [];
        foreach ($this as $f) {
            if ($onlyThese && !in_array($f->name, $onlyThese, true)) continue;
            $names[] = $f->toSqlCol($formatterFn);
        }
        return implode(", ", $names);
    }
    /**
     * @return string "`name` TEXT, `name2` INT UNSIGNED"
     */
    public function toSqlTableFields(): string {
        $fields = [];
        foreach ($this as $f)
            $fields[] = $f->toSqlTableField();
        return implode(", ", $fields);
    }
    /**
     * @return array
     */
    public function jsonSerialize(): array {
        return $this->getArrayCopy();
    }
    /**
     * @psalm-param array<int, RawPageTypeField> $input
     * @return \Sivujetti\PageType\FieldCollection
     */
    public static function fromValidatedInput(array $input): FieldCollection {
        $out = new FieldCollection;
        foreach ($input as $field)
            $out[] = Field::fromValidatedObject($field);
        return $out;
    }
}
