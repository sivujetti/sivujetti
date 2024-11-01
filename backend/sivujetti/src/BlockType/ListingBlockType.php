<?php declare(strict_types=1);

namespace Sivujetti\BlockType;

use Pike\{ArrayUtils, Injector, PikeException, Request};
use Sivujetti\Block\Entities\Block;
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
            ->newProperty("filterAdditional")->dataType(
                $builder::DATA_TYPE_OBJECT,
                sanitizeWith: fn(object $f) => (object) [
                    "tokens" => is_array($f->tokens) ? $f->tokens : [],
                    "paramMap" => is_object($f->paramMap) ? $f->paramMap : (object) [],
                ]
            )
            ->newProperty("rendererSettings")->dataType(
                $builder::DATA_TYPE_OBJECT,
                sanitizeWith: fn(?object $s) => $s
                    ? (object) [
                        "parts" => array_map(fn(object $p) => (object) [
                            "kind" => strval($p->kind),
                            "data" => match ($p->kind) {
                                "heading" => (object) [
                                    "level" => (int) $p->data->level,
                                ],
                                "image" => (object) [
                                    "primarySource" => strval($p->data->primarySource),
                                    "fallbackImageSrc" => strval($p->data->fallbackImageSrc),
                                ],
                                "link" => (object) [
                                    "text" => strval($p->data->text),
                                ],
                                "excerpt" => (object) [
                                    "primarySource" => strval($p->data->primarySource),
                                ],
                                default => null,
                            }
                        ], $s->parts)
                    ]
                    : null,
                isNullable: true
            )
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
        // @allow \RuntimeException
        [$sql, $params] = self::createWhereSqlBundleOrThrow($block->filterAdditional, $pageType->ownFields);
        $statusFilter = PagesController::createGetPublicPageFilters("-", $req->myData->user)["filters"][1] ?? null;
        if ($statusFilter) {
            [$col, $val] = $statusFilter; // Example ["status", 0]
            $sql = $sql ? "({$sql}) AND {$col} = ?" : "{$col} = ?";
            $params[] = $val;
        }
        $q->where($sql, $params);

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
     * @param object $filtersIn Example: {tokens: ["p.categories", "LIKE", ":b1", "AND", "p.slug", "LIKE", ":b2"], paramMap: [":b1" => "%id-here%", ":b2" => "/slug"]}
     * @param array<int, RawPageTypeField> $ownCols
     * @return array [sql, bindParams]
     */
    private static function createWhereSqlBundleOrThrow(object $filtersIn, array $ownCols): array {
        if (!$filtersIn->tokens)
            return ["", []];
        $builtinCols = ["slug"];
        $generator = new SqlGenerator(function ($colPath) use ($ownCols, $builtinCols) {
            $col = explode(".", $colPath)[1] ?? ""; // "p.somecol" -> "somecol"
            if (in_array($col, $builtinCols, true)) return true;
            return ArrayUtils::findIndexByKey($ownCols, $col, "name") > -1;
        });
        // @allow \RuntimeException
        return $generator->generateBundle($filtersIn);
    }
}

class SqlGenerator {
    /** @var string[] */
    private array $tokensIn = [];
    /** @var int */
    private int $cursor = 0;
    /** @var object {key: val} */
    private object $paramsIn;
    /**
     * @var \Closure
     * @psalm-var \Closure(string):bool
     */
    private \Closure $validateCol;
    /** @var string[] */
    private array $sqlOut = [];
    /** @var mixed[] */
    private array $paramsOut = [];
    /**
     * @param \Closure $validateCol
     * @psalm-param \Closure(string):bool $validateCol
     */
    public function __construct(\Closure $validateCol) {
        $this->validateCol = $validateCol;
    }
    /**
     * @param object $filters 
     * @psalm-param object{tokens: string[], paramMap: array<string, mixed>} $filters
     * @return array
     * @psalm-return array{0: string, 1: mixed[]}
     */
    public function generateBundle(object $filters): array {
        $this->tokensIn = $filters->tokens;
        $this->cursor = -1;
        $this->paramsIn = $filters->paramMap;
        $this->sqlOut = [];
        $this->paramsOut = [];
        $this->expressionOrGroup();
        return [implode("", $this->sqlOut), $this->paramsOut];
    }
    /**
     */
    private function expressionOrGroup(): void {
        $colOrParen = $this->consume();

        if (!is_string($colOrParen))
            throw new \RuntimeException($this->createErrMes("Expected column name or parentheses"));
        if ($colOrParen === "(") {
            $this->sqlOut[] = "(";
            $this->expressionOrGroup();
            if ($this->consume() !== ")") throw new \RuntimeException($this->createErrMes("Expected `)`"));
            $this->sqlOut[] = ")";
            if (!$this->peek()) return;
        } else {
            if (!$this->validateCol->__invoke($colOrParen))
                throw new \RuntimeException($this->createErrMes("col {$colOrParen} not valid"));
        }

        $operator = $this->consume();
        if (!in_array($operator, ["LIKE"], true))
            throw new \RuntimeException($this->createErrMes("Expected operator, got `" . ($operator ?? "null") . "`"));

        $bindPlaceholder = $this->consume();
        if (!is_string($bindPlaceholder) || !preg_match("/^:b[0-9]+\$/", $bindPlaceholder))
            throw new \RuntimeException($this->createErrMes("Expected placeholder"));
        if (!($param = $this->paramsIn->{$bindPlaceholder} ?? null))
            throw new \RuntimeException("Param {$bindPlaceholder} not found from the pool");

        $this->sqlOut[] = "{$colOrParen} {$operator} ?";
        $this->paramsOut[] = $param;

        $next = $this->peek();
        if ($next) {
            if (!in_array($next, ["AND", "OR"], true))
                throw new \RuntimeException($this->createErrMes("Expected `AND` or `OR`, got `{$next}`"));
            $this->sqlOut[] = " {$this->consume()} ";
            $this->expressionOrGroup();
        }
    }
    /**
     * @return string|null
     */
    private function consume(): ?string {
        return $this->tokensIn[++$this->cursor] ?? null;
    }
    /**
     * @return string|null
     */
    private function peek(): ?string {
        return $this->tokensIn[$this->cursor + 1] ?? null;
    }
    /**
     * @return string
     */
    private function createErrMes(string $err): string {
        return $err . ($this->sqlOut ? (" after `" . implode("", $this->sqlOut) . "`") : "");
    }
}
