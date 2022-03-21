<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\Tests\Utils\{HttpApiTestTrait, PageTestUtils};

abstract class PagesControllerTestCase extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    protected PageTestUtils $pageTestUtils;
    protected function setUp(): void {
        parent::setUp();
        $this->pageTestUtils = new PageTestUtils(self::$db);
    }
    public static function getDbConfig(): array {
        return require TEST_CONFIG_FILE_PATH;
    }
}
