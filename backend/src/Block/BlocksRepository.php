<?php declare(strict_types=1);

namespace KuuraCms\Block;

use KuuraCms\AssociativeJoinStorageStrategy;
use KuuraCms\EmbeddedDataStorageStrategy;
use KuuraCms\Entities\Block;
use Pike\{Db};

final class BlocksRepository {
    private Db $db;
    private array $results;
    public function __construct(Db $db) {
        $this->db = $db;
        $this->results = [];
    }
    public function fetchOne(string $pageId, string $section): SelectBlocksQuery {
        return new SelectBlocksQuery($this->db, $pageId, $section, function ($b) { $this->results = array_merge($this->results, $b); }, true);
    }
    public function fetchAll(string $pageId, string $section): SelectBlocksQuery {
        return new SelectBlocksQuery($this->db, $pageId, $section, function ($b) { $this->results = array_merge($this->results, $b); });
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
    private bool $single;
    private array $wheretemp = [];
    public function __construct(Db $db, string $pageId, string $section, $d, ?bool $single = null) {
        $this->db = $db;
        if ($pageId) throw new \RuntimeException('not implemented');
        $this->pageId = $pageId;
        $this->section = $section;
        $this->_d = $d;
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
            $blockType = $makeBlockType();
            // todo $blockType->makePropsFromRs()
            if (method_exists($blockType, "fetchData"))
                $makeBlockType()->fetchData($b, $this);
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
