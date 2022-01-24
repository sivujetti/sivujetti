<?php declare(strict_types=1);

namespace Sivujetti\PageType;

use Pike\Db;
use Pike\PikeException;

/**
 * Installs / removes page types to / from the database.
 */
final class PageTypeMigrator {
    private const MAGIC_PAGE_TYPE_NAME = "Draft";
    /** @var \Pike\Db */
    private Db $db;
    /** @var \Sivujetti\PageType\PageTypeValidator */
    private PageTypeValidator $pageTypeValidator;
    /**
     * @param \Pike\Db $db
     */
    public function __construct(Db $db, PageTypeValidator $pageTypeValidator) {
        $this->db = $db;
        $this->pageTypeValidator = $pageTypeValidator;
    }
    /**
     * @param object $input $req->body of `POST /api/page-types`
     * @param bool $asPlaceholder = false
     * @return string $lastInsertId or ""
     * @throws \Pike\PikeException
     */
    public function install(object $input, bool $asPlaceholder = false): string {
        if (!$asPlaceholder && ($input->name ?? "") === self::MAGIC_PAGE_TYPE_NAME)
            throw new PikeException("Invalid input", PikeException::BAD_INPUT);
        // @allow \Pike\PikeException
        if (($errors = $this->pageTypeValidator->validate($input)))
            throw new PikeException(implode(PHP_EOL, $errors), PikeException::BAD_INPUT);
        //
        $fields = FieldCollection::fromValidatedInput($input->ownFields);
        $pageTypeRaw = self::createRawPageType($input, $fields);
        //
        if (!$asPlaceholder)
            $this->createPageType($pageTypeRaw->name, $fields); // @allow \Pike\PikeException
        $insertId = $this->addToInstalledPageTypes($pageTypeRaw); // @allow \Pike\PikeException
        if (!$insertId) throw new PikeException("", PikeException::INEFFECTUAL_DB_OP);
        return $insertId;
    }
    /**
     * @param object $input
     * @param \Sivujetti\PageType\FieldCollection $fields
     * @return object
     */
    private static function createRawPageType(object $input,
                                              FieldCollection $fields): object {
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
    private function createPageType(string $name, FieldCollection $fields): void {
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
