<?php declare(strict_types=1);

namespace KuuraCms;

use KuuraCms\Entities\{Block, Page, PageType};

interface StorageStrategy {
    public function select(PageType $pageType, $temp1, $temp2, $dd): ?Page;
    public function makeBlockFromDbResult(object $row, array $rows, $dd): Block;
    public function update($pageId, $data): void;
    public function delete($pageId, $temp): void;
    public function up(array $data): void;
    public function recreateSchema(): void;
}
