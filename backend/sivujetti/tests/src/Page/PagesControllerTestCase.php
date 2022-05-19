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
    protected ?\Closure $onTearDown;
    protected function setUp(): void {
        parent::setUp();
        $this->pageTestUtils = new PageTestUtils(self::$db);
        $this->dbDataHelper = new DbDataHelper(self::$db);
        $this->onTearDown = null;
    }
    protected function tearDown(): void {
        parent::tearDown();
        if ($this->onTearDown)
            $this->onTearDown->__invoke();
    }
    public static function getDbConfig(): array {
        return require TEST_CONFIG_FILE_PATH;
    }
    protected function insertTestPageDataToDb(object $stateOrPageData,
                                              ?PageType $pageType = null): void {
        $mutRef = $stateOrPageData instanceof \TestState
            ? $stateOrPageData->testPageData
            : $stateOrPageData;
        $insertId = $this->pageTestUtils->insertPage($mutRef, $pageType);
        $mutRef->id = $insertId;
    }
}
