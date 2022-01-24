<?php declare(strict_types=1);

namespace Sivujetti\PageType;

use Pike\{ArrayUtils, PikeException, Request, Response};
use Sivujetti\Block\Entities\Block;
use Sivujetti\BlockType\Entities\BlockProperty;
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\TheWebsite\Entities\TheWebsite;

final class PageTypesController {
    /**
     * POST /api/page-types/as-placeholder: Inserts new page type to the database
     * using self::createEmptyPageType()'s data.
     *
     * @param \Pike\Response $res
     * @param \Sivujetti\PageType\PageTypeMigrator $migrator
     */
    public function createPlaceholderPageType(Response $res,
                                              PageTypeMigrator $migrator): void {
        // @allow \Pike\PikeException
        $migrator->install(self::createEmptyPageType(), true);
        $res->status(201)->json(["ok" => "ok"]);
    }
    /**
     * @return object
     */
    public static function createEmptyPageType(): object {
        $out = new \stdClass;
        $out->name = "Draft";
        $out->slug = "draft";
        $out->friendlyName = "_";
        $out->friendlyNamePlural = "_";
        $out->description = "_";
        $out->blockFields = [Block::fromBlueprint((object) [
            "type" => Block::TYPE_PARAGRAPH,
            "title" => "",
            "defaultRenderer" => "sivujetti:block-auto",
            "initialData" => (object) ["text" => "Paragraph text.", "cssClass" => ""],
            "children" => [],
        ])];
        $out->ownFields = [(object) [
            "name" => "field1",
            "friendlyName" => "Field 1",
            "dataType" => (object) [
                "type" => BlockProperty::DATA_TYPE_TEXT,
                "length" => null,
                "validationRules" => null
            ],
            "defaultValue" => "",
            "isNullable" => false
        ]];
        $out->defaultFields = (object) ["title" => (object) ["defaultValue" => "Title"]];
        $out->defaultLayoutId = "1";
        $out->status = PageType::STATUS_DRAFT;
        $out->isListable = true;
        return $out;
    }
}
