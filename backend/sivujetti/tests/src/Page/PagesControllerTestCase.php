<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use Pike\{ArrayUtils, Injector};
use Pike\Interfaces\SessionInterface;
use Pike\TestUtils\{DbTestCase, HttpTestUtils};
use Sivujetti\BlockType\{BlockTypeInterface, PropertiesBuilder, SaveAwareBlockTypeInterface};
use Sivujetti\PageType\Entities\PageType;
use Sivujetti\SharedAPIContext;
use Sivujetti\Tests\Utils\{DbDataHelper, HttpApiTestTrait, PageTestUtils, TestEnvBootstrapper};
use Sivujetti\UserSite\UserSiteAPI;

abstract class PagesControllerTestCase extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    protected PageTestUtils $pageTestUtils;
    protected SharedAPIContext $testApiCtx;
    protected DbDataHelper $dbDataHelper;
    protected ?\Closure $onTearDown;
    protected function setUp(): void {
        parent::setUp();
        $this->testApiCtx = new SharedAPIContext;
        $this->pageTestUtils = new PageTestUtils(self::$db, $this->testApiCtx);
        $this->dbDataHelper = new DbDataHelper(self::$db);
        $this->onTearDown = null;
    }
    protected function tearDown(): void {
        parent::tearDown();
        if ($this->onTearDown)
            $this->onTearDown->__invoke();
    }
    public static function getDbConfig(): array {
        return (require TEST_CONFIG_FILE_PATH)["app"];
    }
    public function makePagesControllerTestApp(\TestState $state, ?int $loggedInUserRole = null): void {
        $this->makeTestSivujettiApp($state, function (TestEnvBootstrapper $bootModule) use ($loggedInUserRole) {
            $bootModule->useMock("apiCtx", [$this->testApiCtx]);
            if ($loggedInUserRole !== null)
                $bootModule->useMock("auth", [":session" => $this->createMock(SessionInterface::class),
                                              ":userRole" => $loggedInUserRole]);
        });
    }
    protected function insertTestPageDataToDb(object $stateOrPageData,
                                              PageType|string|null $pageType = null): void {
        $data = $stateOrPageData instanceof \TestState
            ? $stateOrPageData->testPageData
            : $stateOrPageData;
        $this->pageTestUtils->insertPage($data, $pageType);
    }
    protected function registerTestCustomBlockType(): string {
        $mutRef = $this->testApiCtx;
        $api = new UserSiteAPI("site", $mutRef);
        $api->registerBlockType("Icon", new class implements BlockTypeInterface, SaveAwareBlockTypeInterface {
            public function defineProperties(PropertiesBuilder $builder): \ArrayObject {
                return $builder
                    ->newProperty("iconId", $builder::DATA_TYPE_TEXT)
                    ->getResult();
            }
            public function onBeforeSave(bool $isInsert,
                                         object $storableBlock,
                                         BlockTypeInterface $blockType,
                                         Injector $di): void {
                $someDataSource = ["check-circle" => "<svg>1"];
                $iconId = ArrayUtils::findByKey($storableBlock->propsData, "iconId", "key")->value;
                $storableBlock->propsData[] = (object) [
                    "key" => "__alwaysAddedDynamicProp",
                    "value" => $someDataSource[$iconId] ?? "not-found"
                ];
            }
        });
        return "Icon";
    }
}
