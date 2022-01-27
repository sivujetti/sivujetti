<?php declare(strict_types=1);

namespace Sivujetti\PageType;

use Pike\Db;
use Pike\PikeException;
use Sivujetti\PageType\Entities\PageType;

/**
 * Installs / removes page types to / from the database.
 */
final class PageTypeMigrator {
    public const MAGIC_PAGE_TYPE_NAME = "Draft";
    /** @var \Pike\Db */
    private Db $db;
    /** @var \Sivujetti\PageType\PageTypeValidator */
    private PageTypeValidator $pageTypeValidator;
    /**
     * @param \Pike\Db $db
     * @param \Sivujetti\PageType\PageTypeValidator $pageTypeValidator
     */
    public function __construct(Db $db, PageTypeValidator $pageTypeValidator) {
        $this->db = $db;
        $this->pageTypeValidator = $pageTypeValidator;
    }
    /**
     * @param object $input $req->body of `POST /api/page-types`
     * @param bool $asPlaceholder = true
     * @return \Sivujetti\PageType\Entities\PageType
     * @throws \Pike\PikeException
     */
    public function install(object $input, bool $asPlaceholder = true): PageType {
        if (!$asPlaceholder && ($input->name ?? "") === self::MAGIC_PAGE_TYPE_NAME)
            throw new PikeException("Invalid input", PikeException::BAD_INPUT);
        if (($errors = $this->pageTypeValidator->validate($input)))
            throw new PikeException(implode(PHP_EOL, $errors), PikeException::BAD_INPUT);
        //
        $fields = FieldCollection::fromValidatedInput($input->ownFields);
        $pageTypeRaw = self::createRawPageType($input, $fields);
        //
        if (!$asPlaceholder)
            $this->createDataStore($pageTypeRaw->name, $fields); // @allow \Pike\PikeException
        $insertId = $this->addToInstalledPageTypes($pageTypeRaw); // @allow \Pike\PikeException
        if (!$insertId) throw new PikeException("", PikeException::INEFFECTUAL_DB_OP);
        return PageType::fromRawPageType($pageTypeRaw);
    }
    /**
     * @param object $input $req->body of `PUT /api/page-types`
     * @param \Sivujetti\PageType\Entities\PageType $current
     * @param bool $asPlaceholder = true
     * @throws \Pike\PikeException
     */
    public function update(object $input,
                           PageType $current,
                           bool $asPlaceholder = true): void {
        if (($errors = $this->pageTypeValidator->validate($input)))
            throw new PikeException(implode(PHP_EOL, $errors), PikeException::BAD_INPUT);
        if ($current->name === PageType::PAGE && $input->name !== PageType::PAGE)
            throw new PikeException("Renaming page type `{$current->name}` not supported yet.",
                                    PikeException::BAD_INPUT);
        if (!$asPlaceholder && $input->name === self::MAGIC_PAGE_TYPE_NAME)
            throw new PikeException("Page type name `{$input->name}` is reserved.",
                                    PikeException::BAD_INPUT);
        //
        $fields = FieldCollection::fromValidatedInput($input->ownFields);
        $newPageTypeRaw = self::createRawPageType($input, $fields);
        $newPageTypeRaw->status = $asPlaceholder ? PageType::STATUS_DRAFT : PageType::STATUS_COMPLETE;
        //
        [$columns, $values] = $this->db->makeUpdateQParts($newPageTypeRaw);
        // @allow \Pike\PikeException
        $this->db->exec("UPDATE `\${p}pageTypes` SET {$columns} WHERE `name` = ?",
                        array_merge($values, [$current->name]));
        //
        if ($newPageTypeRaw->status === PageType::STATUS_COMPLETE &&
            $current->status === PageType::STATUS_DRAFT) {
            // @allow \Pike\PikeException
            $this->createDataStore($newPageTypeRaw->name, $fields);
        }
    }
    /**
     * @param \Sivujetti\PageType\Entities\PageType $current
     * @param bool $asPlaceholder = true
     * @throws \Pike\PikeException
     */
    public function delete(PageType $current,
                           bool $asPlaceholder = true): void {
        if ($asPlaceholder === false)
            throw new PikeException("Not supported yet",
                                    PikeException::BAD_INPUT);
        if ($current->name === PageType::PAGE)
            throw new PikeException("Deleting page type `{$current->name}` not supported yet.",
                                    PikeException::BAD_INPUT);
        // @allow \Pike\PikeException
        $this->db->exec("DELETE FROM `\${p}pageTypes` WHERE `name` = ?",
                        [$current->name]);
    }
    /**
     * @param object $input
     * @param \Sivujetti\PageType\FieldCollection $fields
     * @return object
     */
    public static function createRawPageType(object $input,
                                             \Sivujetti\PageType\FieldCollection $fields): object {
        $pageTypeRaw = new \stdClass;
        $pageTypeRaw->name = $input->name;
        $pageTypeRaw->slug = $input->slug;
        $pageTypeRaw->friendlyName = $input->friendlyName;
        $pageTypeRaw->friendlyNamePlural = $input->friendlyNamePlural;
        $pageTypeRaw->description = $input->description;
        $pageTypeRaw->fields = json_encode((object) [
            "blockFields" => array_map(fn(object $blockRaw) =>
                self::inputToBlueprint($blockRaw)
            , $input->blockFields),
            "ownFields" => $fields, // Will trigger jsonSerialize()
            "defaultFields" => (object) ["title" => (object) [
                "defaultValue" => $input->defaultFields->title->defaultValue,
            ]],
        ], JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
        $pageTypeRaw->defaultLayoutId = $input->defaultLayoutId;
        $pageTypeRaw->status = $input->status;
        $pageTypeRaw->isListable = $input->isListable;
        return $pageTypeRaw;
    }
    /**
     * @param string $name Validated name for the new page type
     * @param \Sivujetti\PageType\FieldCollection $fields
     */
    private function createDataStore(string $name, FieldCollection $fields): void {
        $dt = $this->db->attr(\PDO::ATTR_DRIVER_NAME) === "sqlite" ? [
            "id" => "INTEGER PRIMARY KEY AUTOINCREMENT",
            "slug" => "TEXT",
            "path" => "TEXT",
            "level" => "INTEGER",
            "title" => "TEXT",
            "layoutId" => "TEXT",
            "status" => "INTEGER",
            "tail" => ")",
        ] : [
            "id" => "MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT",
            "slug" => "VARCHAR(92)",
            "path" => "VARCHAR(191)",
            "level" => "TINYINT(1) UNSIGNED",
            "title" => "VARCHAR(92)",
            "layoutId" => "VARCHAR(191)",
            "status" => "TINYINT(1)",
            "tail" => ", PRIMARY KEY (`id`) ) DEFAULT CHARSET = utf8mb4",
        ];
        // @allow \Pike\PikeException
        $this->db->exec("CREATE TABLE `\${p}{$name}` (
            `id` {$dt["id"]},
            " . (count($fields) ? "{$fields->toSqlTableFields()}," : "") . "
            `slug` {$dt["slug"]} NOT NULL,
            `path` {$dt["path"]} NOT NULL,
            `level` {$dt["level"]} NOT NULL DEFAULT 1,
            `title` {$dt["title"]} NOT NULL,
            `layoutId` {$dt["layoutId"]} NOT NULL,
            `blocks` JSON,
            `status` {$dt["status"]} NOT NULL DEFAULT 0
            {$dt["tail"]}"
        );
    }
    /**
     * @param \RadCms\ContentType\ContentTypeCollection $contentTypes
     * @return string $lastInsertId or ""
     */
    private function addToInstalledPageTypes(object $pageTypeRaw): string {
        [$qList, $values, $columns] = $this->db->makeInsertQParts($pageTypeRaw);
        $numRows = $this->db->exec("INSERT INTO `\${p}pageTypes` ({$columns}) VALUES ({$qList})",
                                   $values);
        return $numRows === 1 ? $this->db->lastInsertId() : "";
    }
    /**
     * @param object|\Sivujetti\Block\Entities\Block $blueprint
     * @return object
     */
    public static function inputToBlueprint(object $input): object {
        $out = new \stdClass;
        $out->type = $input->type;
        $out->title = $input->title;
        $out->defaultRenderer = $input->renderer;
        $initialData = new \stdClass;
        foreach ($input->propsData as $field)
            $initialData->{$field->key} = $field->value;
        $out->initialData = $initialData;
        $out->children = [];
        foreach ($input->children as $child)
            $out->children[] = self::inputToBlueprint($child);
        return $out;
    }
}
