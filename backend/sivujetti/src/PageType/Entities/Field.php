<?php declare(strict_types=1);

namespace Sivujetti\PageType\Entities;

final class Field {
    /** @var string */
    public string $name;
    /** @var string */
    public string $friendlyName;
    /** @var \Sivujetti\PageType\Entities\DataType */
    public DataType $dataType;
    /** @var string */
    public string $defaultValue;
    /** @var bool */
    public bool $isNullable;
    /**
     * @param \Closure $formatterFn = null fn(\Sivujetti\PageType\Entities\Field $field): string
     * @return string '`name`, `name2`'
     */
    public function toSqlCol(\Closure $formatterFn = null): string {
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
     * @param object $input {name: string, friendlyName: string, dataType: {type: string, length?: int, validationRules?: array[]}, defaultValue: string, isNullable: bool}
     * @return \Sivujetti\PageType\Entities\Field
     */
    public static function fromValidatedObject(object $input): Field {
        $out = new Field;
        $out->name = $input->name;
        $out->friendlyName = $input->friendlyName;
        $out->dataType = DataType::fromValidatedObject($input->dataType);
        $out->defaultValue = $input->defaultValue;
        $out->isNullable = $input->isNullable;
        return $out;
    }
}

class DataType {
    /** @var string */
    public string $type;
    /** @var ?int */
    public ?int $length;
    /** @var ?array<int, mixed[]> */
    public ?array $validationRules;
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
     * @param object $obj {type: string, length?: int, validationRules?: array<int, mixed[]>}
     * @return \Sivujetti\PageType\Entities\DataType
     */
    public static function fromValidatedObject(object $obj): DataType {
        $out = new DataType;
        $out->type = $obj->type;
        $out->length = $obj->length ?? null;
        $out->validationRules = $obj->validationRules ?? null;
        return $out;
    }
}
