<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\Tests\Utils\{DbDataHelper, HttpApiTestTrait, PageTestUtils};

abstract class PagesControllerTestCase extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    protected PageTestUtils $pageTestUtils;
    protected DbDataHelper $dbDataHelper;
    protected function setUp(): void {
        parent::setUp();
        $this->pageTestUtils = new PageTestUtils(self::$db);
        $this->dbDataHelper = new DbDataHelper(self::$db);
    }
    public static function getDbConfig(): array {
        return require TEST_CONFIG_FILE_PATH;
    }
    protected function insertTestPageDataToDb(\TestState $state, ?PageType $pageType = null): void {
        $insertId = $this->pageTestUtils->insertPage($state->testPageData,
                                                     $pageType);
        $state->testPageData->id = $insertId;
    }
}
