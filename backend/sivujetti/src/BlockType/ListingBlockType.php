<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Pike\{ArrayUtils, Injector, PikeException, Request};
use Sivujetti\Block\Entities\Block;
use Sivujetti\{JsonUtils};
use Sivujetti\Page\{PagesController, PagesRepository2};
use Sivujetti\TheWebsite\Entities\TheWebsite;

/**
 * @psalm-import-type RawPageTypeField from \Sivujetti\PageType\Entities\Field
 */
class ListingBlockType implements BlockTypeInterface, RenderAwareBlockTypeInterface {
    /**
     * @inheritdoc
     */
    public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
        return $builder
            ->newProperty("filterPageType")->dataType($builder::DATA_TYPE_TEXT, validationRules: [
                ["identifier"]
            ])
            ->newProperty("filterLimit", $builder::DATA_TYPE_UINT)
            ->newProperty("filterLimitType")->dataType($builder::DATA_TYPE_TEXT, validationRules: [
                ["in", ["all", "single", "atMost"]]
            ])
            ->newProperty("filterOrder")->dataType($builder::DATA_TYPE_TEXT, validationRules: [
                ["in", ["desc", "asc", "rand"]]
            ])
            ->newProperty("filterAdditional", $builder::DATA_TYPE_OBJECT/*, sanitizeWith: omit/allow object as it is */)
            ->newProperty("rendererSettings")->dataType($builder::DATA_TYPE_OBJECT/*, sanitizeWith: omit/allow object as it is */, isNullable: true)
            ->getResult();
    }
    /**
     * @inheritdoc
     */
    public function onBeforeRender(Block $block,
                                   BlockTypeInterface $blockType,
                                   Injector $di): void {
        $di->execute($this->doPerformBeforeRender(...), [
            ":block" => $block,
        ]);
    }
    /**
     * @param \Sivujetti\Block\Entities\Block $block
     * @param \Sivujetti\Page\PagesRepository2 $pagesRepo
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $theWebsite
     * @param \Sivujetti\TheWebsite\Entities\TheWebsite $req 
     */
    private function doPerformBeforeRender(Block $block,
                                          PagesRepository2 $pagesRepo,
                                          TheWebsite $theWebsite,
                                          Request $req): void {
        $pageType = ArrayUtils::findByKey($theWebsite->pageTypes, $block->filterPageType, "name");
        $q = $pagesRepo->select($block->filterPageType, ["@own", "@blocks"]); // <- note @blocks

        $mongoFilters = count((array) $block->filterAdditional)
            ? self::getValidFilters($block->filterAdditional, $pageType->ownFields)
            : new \stdClass;
        $statusFilter = PagesController::createGetPublicPageFilters("-", $req->myData->user)["filters"][1] ?? null;
        if ($statusFilter) {
            [$col, $val] = $statusFilter; // Example ["status", 0]
            $mongoFilters->{$col} = (object) ["\$eq" => $val];
        }
        if (count((array) $mongoFilters)) {
            $q = $q->mongoWhere(JsonUtils::stringify($mongoFilters));
        }

        if ($block->filterLimit)
            $q = $q->limit($block->filterLimit);
        if ($block->filterOrder)
            $q = $q->orderBy(match($block->filterOrder) {
                "desc" => "p.`createdAt` DESC",
                "asc" => "p.`createdAt` ASC",
                "rand" => "RANDOM()",
                default => throw new PikeException("Sanity", PikeException::BAD_INPUT),
            });
        $block->__pages = $q->fetchAll();
        $block->__pageType = $pageType;
    }
    /**
     * @param object $filtersIn Example: {"p.categories": {$contains: "\"catid\""}, "p.slug": {$startsWith: "/slug"}}
     * @param array<int, RawPageTypeField> $pageTypesFields
     * @return object Identical to $filterIn if all props are valid
     */
    private static function getValidFilters(object $filtersIn, array $pageTypesFields): object {
        $out = new \stdClass;
        $builtinCols = ["slug"];
        foreach ($filtersIn as $colPath => $obj) {
            $col = explode(".", $colPath)[1]; // "p.categories" -> "categories"

            if (!in_array($col, $builtinCols, true) &&                  // not builtin ...
                !ArrayUtils::findByKey($pageTypesFields, $col, "name")) // nor this page type's field
                continue;

            foreach ($obj as $_operator => $val) // $_operator = "$contains", $val = "foo" ...
                if (!strlen($val))
                    continue;

            $out->{$colPath} = $obj;
        }
        return $out;
    }
}
