<?php declare(strict_types=1);

namespace Sivujetti\Tests\PageType;

use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\Tests\Utils\{BlockTestUtils, HttpApiTestTrait};

abstract class PageTypeControllerTestCase extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    protected BlockTestUtils $blockTestUtils;
    protected const TEST_NAME = "MyCustomArticles";
    protected function setUp(): void {
        parent::setUp();
        $this->blockTestUtils = new BlockTestUtils;
    }
    protected function tearDown(): void {
        parent::tearDown();
        self::$db->exec("DELETE FROM `pageTypes` WHERE `name` = ?", [self::TEST_NAME]);
        self::$db->exec("DROP TABLE IF EXISTS `" . self::TEST_NAME . "`");
    }
}
