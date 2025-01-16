<?php declare(strict_types=1);

namespace Sivujetti\PageType\Entities;

/**
 * @phpstan-type RawPageTypeField object{name: string, friendlyName: string, dataType: {type: string, isNullable?: bool, length?: int, validationRules?: list<list<mixed>>, canBeEditedBy?: int}, defaultValue: string|int|list<mixed>}
 */
final class Field extends \stdClass {
    /** @var string */
    public string $name;
    /** @var string */
    public string $friendlyName;
    /** @var \Sivujetti\PageType\Entities\DataType */
    public DataType $dataType;
    /** @var string|int|list<mixed> */
    public string|int|array $defaultValue;
    /**
     * @param (\Closure(self): string)|null $formatterFn = null
     * @return string '`name`, `name2`'
     */
    public function toSqlCol(?\Closure $formatterFn = null): string {
        if (!$formatterFn)
            return "`{$this->name}`";
        return $formatterFn($this);
    }
    /**
     * @return string '`name` TEXT' or '`title` VARCHAR(127)'
     */
    public function toSqlTableField(): string {
        return "`{$this->name}` {$this->dataType->toSql()}";
    }
    /**
     * @param RawPageTypeField $input
     * @return self
     */
    public static function fromValidatedObject(object $input): Field {
        $out = new Field;
        $out->name = $input->name;
        $out->friendlyName = $input->friendlyName;
        $out->dataType = DataType::fromValidatedObject($input->dataType);
        $out->defaultValue = $input->defaultValue;
        return $out;
    }
}

class DataType {
    /** @var string */
    public string $type;
    /** @var bool */
    public bool $isNullable;
    /** @var ?int */
    public ?int $length;
    /** @var ?list<list<mixed>> */
    public ?array $validationRules;
    /** @var ?int */
    public ?int $canBeEditedBy;
    /**
     * @return string "TEXT", "INT(64)"
     */
    public function toSql(): string {
        $len = $this->length ?? 0;
        switch ($this->type) {
        case "text":
            $t = (!$len ? "TEXT" : "VARCHAR") . "%s";
            break;
        case "json":
            $t = "JSON";
            $len = 0;
            break;
        case "int":
            $t = "INT%s";
            break;
        case "uint":
            $t = "INT%s UNSIGNED";
            break;
        default:
            $t = "TEXT%s";
        }
        return sprintf($t, !$len ? "" : "({$len})");
    }
    /**
     * @return string "text", "int64"
     */
    public function __toString(): string {
        return $this->type . ($this->length ?? "");
    }
    /**
     * @param object $obj {type: string, isNullable?: bool, length?: int, validationRules?: list<list<mixed>>, canBeEditedBy?: int}
     * @return \Sivujetti\PageType\Entities\DataType
     */
    public static function fromValidatedObject(object $obj): DataType {
        $out = new DataType;
        $out->type = $obj->type;
        $out->isNullable = $obj->isNullable ?? false;
        $out->length = $obj->length ?? null;
        $out->validationRules = $obj->validationRules ?? null;
        $out->canBeEditedBy = $obj->canBeEditedBy ?? null;
        return $out;
    }
}
