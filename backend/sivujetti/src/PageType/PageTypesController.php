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
    public function updatePageType(Request $req,
                                   Response $res,
                                   PageTypeMigrator $migrator,
                                   TheWebsite $theWebsite): void {
        $cur = self::getPageTypeOrThrow($theWebsite->pageTypes);
        // @allow \Pike\PikeException
        $migrator->update($req->body, $cur, property_exists($req->params, "asPlaceholder"));
        $res->status(200)->json(["ok" => "ok"]);
    }
    /**
     * DELETE /api/page-types/:name/:asPlaceholder?: Deletes page type $req->params->name
     * from the database.
     *
     * @param \Pike\Request $req
     * @param \Pike\Response $res
     * @param \Sivujetti\PageType\PageTypeMigrator $migrator
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     */
    public function deletePageType(Request $req,
                                   Response $res,
                                   PageTypeMigrator $migrator,
                                   TheWebsite $theWebsite): void {
        $cur = self::getPageTypeOrThrow($theWebsite->pageTypes);
        // @allow \Pike\PikeException
        $migrator->delete($cur, property_exists($req->params, "asPlaceholder"));
        $res->status(200)->json(["ok" => "ok"]);
    }
    /**
     * @return object Same as $req->body of `PUT /api/page-types`
     */
    public static function createEmptyPageTypeInput(): object {
        $out = new \stdClass;
        $out->name = PageTypeMigrator::MAGIC_PAGE_TYPE_NAME;
        $out->slug = "/draft";
        $out->friendlyName = "_";
        $out->friendlyNamePlural = "_";
        $out->description = "_";
        $out->blockFields = [Block::fromBlueprint((object) [
            "type" => Block::TYPE_TEXT,
            "title" => "",
            "defaultRenderer" => "sivujetti:block-auto",
            "initialData" => (object) ["html" => "<p>Paragraph text.</p>"],
            "children" => [],
        ])];
        $out->ownFields = [(object) [
            "name" => "field1",
            "friendlyName" => "Field 1",
            "dataType" => (object) [
                "type" => BlockProperty::DATA_TYPE_TEXT,
                "isNullable" => false,
                "length" => null,
                "validationRules" => null
            ],
            "defaultValue" => "",
        ]];
        $out->defaultFields = (object) ["title" => (object) ["defaultValue" => "Title"]];
        $out->defaultLayoutId = "1";
        $out->status = PageType::STATUS_DRAFT;
        $out->isListable = true;
        return $out;
    }
    /**
     * @param \ArrayObject<int, \Sivujetti\PageType\Entities\PageType> $pageTypes
     * @return \Sivujetti\PageType\Entities\PageType
     * @throws \Pike\PikeException
     */
    private static function getPageTypeOrThrow(\ArrayObject $pageTypes): PageType {
        $name = PageTypeMigrator::MAGIC_PAGE_TYPE_NAME;
        if (!($out = ArrayUtils::findByKey($pageTypes, $name, "name")))
            throw new PikeException("Unknown page type `{$name}`.");
        return $out;
    }
}
