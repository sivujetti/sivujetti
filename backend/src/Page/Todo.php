<?php declare(strict_types=1);

namespace KuuraCms\Page;

use KuuraCms\EmbeddedDataStorageStrategy;
use KuuraCms\Block\Entities\Block;
use KuuraCms\Page\Entities\Page;
use KuuraCms\SharedAPIContext;
use KuuraCms\StorageStrategy;
use Pike\{ArrayUtils, Db, PikeException};

final class Todo {
    public function __construct(Db $db, SharedAPIContext $storage) {
        $this->db = $db;
        $this->pageTypes = $storage->getDataHandle()->pageTypes;
        $this->blockTypes = $storage->getDataHandle()->blockTypes;
    }
    public function tempFetch(string $pageTypeName, $temp1=null, $temp2=null): ?Page {
        [$pt, $dd, $Cls] = $this->ewrd($pageTypeName);
        return (new $Cls($this->db))->select($pt, $temp1, $temp2, $dd);
    }
    public function tempFetchMany(string $pageTypeName): array {
        [$pt, $dd, $Cls] = $this->ewrd($pageTypeName);
        return (new $Cls($this->db))->selectMany($pt, $dd);
    }
    private function ewrd(string $pageTypeName): array {
        if (!($pt = ArrayUtils::findByKey(
            $this->pageTypes,
            $pageTypeName,
            "name"
        ))) throw new PikeException("");
        //
        $Cls = self::getActiveStorageImplCls();

        $dd = function (Block $b) {
            $makeBlockType = $this->blockTypes[$b->type] ?? null;
            if (!$makeBlockType) {echo $b->type;return $b;}
            $blockType = $makeBlockType();
            // todo $blockType->makePropsFromRs()
            if (method_exists($blockType, "fetchData"))
                $makeBlockType()->fetchData($b, $this);
            return $b;
        };

        return [$pt, $dd, $Cls];
    }
    private static function getActiveStorageImplCls(): string {
        return [
            'associative' => AssociativeJoinStorageStrategy::class,
            'embedded' => EmbeddedDataStorageStrategy::class,
        ][STORAGE_STATEGY];
    }
    public function tempDelete($pageId, bool $doDeleteBlocksAsWell): void {
        $Cls = self::getActiveStorageImplCls();
        (new $Cls($this->db))->delete($pageId, $doDeleteBlocksAsWell);
    }
    public function tempUpdate($pageId, $data): void {
        $Cls = self::getActiveStorageImplCls();
        (new $Cls($this->db))->update($pageId, $data);
    }
}
