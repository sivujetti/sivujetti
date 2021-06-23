<?php declare(strict_types=1);

namespace KuuraCms\Block;

use KuuraCms\AssociativeJoinStorageStrategy;
use KuuraCms\Block\Entities\Block;
use KuuraCms\EmbeddedDataStorageStrategy;
use KuuraCms\SharedAPIContext;
use Pike\{Db};

final class BlocksRepository {
    private Db $db;
    private $di;
    private array $results;
    public function __construct(Db $db, SharedAPIContext $storage) {
        $this->db = $db;
        $this->di = $storage->di;
        $this->results = [];
    }
    public function fetchOne(string $pageId, string $section): SelectBlocksQuery {
        return new SelectBlocksQuery($this->db, $pageId, $section,
            function ($b) { $this->results = array_merge($this->results, $b); },
            fn($makeBlockType) => $makeBlockType instanceof \Closure ? $makeBlockType() : $this->di->make($makeBlockType), true);
    }
    public function fetchAll(string $pageId, string $section): SelectBlocksQuery {
        return new SelectBlocksQuery($this->db, $pageId, $section,
            function ($b) { $this->results = array_merge($this->results, $b); },
            fn($makeBlockType) => $makeBlockType instanceof \Closure ? $makeBlockType() : $this->di->make($makeBlockType));
    }
    public function getResults(): array {
        return $this->results;
    }
}

final class SelectBlocksQuery {
    private Db $db;
    private string $pageId;
    private string $section;
    private $_d;
    private $_d2;
    private bool $single;
    private array $wheretemp = [];
    public function __construct(Db $db, string $pageId, string $section, $d, $d2, ?bool $single = null) {
        $this->db = $db;
        if ($pageId) throw new \RuntimeException('not implemented');
        $this->pageId = $pageId;
        $this->section = $section;
        $this->_d = $d;
        $this->_d2 = $d2;
        $this->single = $single ?? false;
    }
    public function where(string $prop, $val): SelectBlocksQuery {
        $this->wheretemp = [$prop, $val];
        return $this;
    }
    public function exec(): object|array|null {

        $Cls = [
            'associative' => AssociativeJoinStorageStrategy::class,
            'embedded' => EmbeddedDataStorageStrategy::class,
        ][STORAGE_STATEGY];

        $dd = function (Block $b) {
            $makeBlockType = $this->blockTypes[$b->type] ?? null;
            if (!$makeBlockType) return $b;
            $blockType = call_user_func($this->_d2, $makeBlockType);
            // todo $blockType->makePropsFromRs()
            if (method_exists($blockType, "fetchData"))
                $blockType->fetchData($b, null);
            return $b;
        };

        return (new $Cls($this->db))->selectBlocks(
            $this->section,
            $this->wheretemp[0],
            $this->wheretemp[1],
            $this->single,
            $this->_d,
            $dd
        );
    }
}
