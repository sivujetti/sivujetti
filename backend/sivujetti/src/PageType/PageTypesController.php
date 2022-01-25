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
        $newPageType = $migrator->install(self::createEmptyPageTypeInput(), true);
        $res->status(201)->json(["ok" => "ok",
                                 "newEntity" => $newPageType]);
    }
    /**
     * PUT /api/page-types/:name/:asPlaceholder?: Updates page type $req->params->name
     * to the database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\PageType\PageTypeMigrator $migrator
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     */
    public function updatePlaceholderPageType(Request $req,
                                              Response $res,
                                              PageTypeMigrator $migrator,
                                              TheWebsite $theWebsite): void {
        if (!($cur = ArrayUtils::findByKey($theWebsite->pageTypes, $migrator::MAGIC_PAGE_TYPE_NAME, "name")))
            throw new PikeException("Unknown page type `{$req->params->name}`.");
        // @allow \Pike\PikeException
        $migrator->update($req->body, $cur, property_exists($req->params, "asPlaceholder"));
        $res->status(200)->json(["ok" => "ok"]);
    }
    /**
     * @return object Same as $req->body of `PUT /api/page-types`
     */
    public static function createEmptyPageTypeInput(): object {
        $out = new \stdClass;
        $out->name = PageTypeMigrator::MAGIC_PAGE_TYPE_NAME;
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
