<?php declare(strict_types=1);

namespace Sivujetti\Layout;

use Pike\Db;
use Sivujetti\Block\{BlocksController, BlockTree};
use Sivujetti\BlockType\Entities\BlockTypes;
use Sivujetti\Page\PagesRepository;

final class LayoutBlocksRepository {
    /** @var \Pike\Db */
    private Db $db;
    /**
     * @param \Pike\Db $db
     * @param \Sivujetti\BlockType\Entities\BlockTypes $blockTypes
     */
    public function __construct(Db $db, BlockTypes $blockTypes) {
        $this->db = $db;
        $this->blockTypes = $blockTypes;
    }
    /**
     * @param string $id
     * @param object[] $blocks
     * @param bool $doInsertRevision = false
     * @return int $numAffectedRows
     */
    public function updateById(string $id, array $blocks, bool $doInsertRevision = false): int {
        if ($doInsertRevision)
            throw new \RuntimeException("Not implemented yet.");
        $updateData = ["blocks" => BlockTree::toJson(
            BlocksController::makeStorableBlocksDataFromValidInput(
                $blocks, $this->blockTypes)
        )];
        [$columns, $values] = $this->db->makeUpdateQParts($updateData);
        return $this->db->exec("UPDATE `\${p}layoutBlocks` SET {$columns} WHERE `layoutId` = ?",
                               array_merge($values, [$id]));
    }
    /**
     * @param string $layoutId
     * @return object[]
     */
    public function getMany(string $layoutId): array {
        $rows = $this->db->fetchAll("SELECT `blocks` AS `blocksJson`, `layoutId`" .
                                    " FROM `\${p}layoutBlocks` WHERE `layoutId` = ?",
                                   [$layoutId],
                                   \PDO::FETCH_CLASS,
                                   '\stdClass');
        return $this->normalizeRs($rows);
    }
    /**
     * @inheritdoc
     */
    private function normalizeRs(array $rows): array {
        foreach ($rows as $row)
            $row->blocks = PagesRepository::blocksFromRs("blocksJson", $row);
        return $rows;
    }
}
