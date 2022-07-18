<?php declare(strict_types=1);

namespace Sivujetti\Tests\GlobalBlockTree;

use Sivujetti\Tests\Utils\{BlockTestUtils, DbDataHelper, GlobalBlockTreeTestUtils, HttpApiTestTrait};
use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\Block\BlockTree;

abstract class GlobalBlockTreesControllerTestCase extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    protected GlobalBlockTreeTestUtils $globalBlockTreeTestUtils;
    protected DbDataHelper $dbDataHelper;
    protected function setUp(): void {
        parent::setUp();
        $this->globalBlockTreeTestUtils = new GlobalBlockTreeTestUtils(new BlockTestUtils);
        $this->dbDataHelper = new DbDataHelper(self::$db);
    }
    public static function getDbConfig(): array {
        return require TEST_CONFIG_FILE_PATH;
    }
    protected function setupTest(): \TestState {
        $state = new \TestState;
        $state->inputData = $this->globalBlockTreeTestUtils->makeGlobalBlockTreeData();
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    protected function insertTestGlobalBlockTreeToDb(\TestState $state, object $data = null): void {
        $globalBlockTreeData = clone ($data ?? $state->originalData);
        $globalBlockTreeData->blocks = BlockTree::toJson($globalBlockTreeData->blocks);
        $insertId = $this->dbDataHelper->insertData($globalBlockTreeData, "globalBlockTrees");
        $globalBlockTreeData->id = $insertId;
    }
}
