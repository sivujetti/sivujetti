<?php declare(strict_types=1);

namespace Sivujetti\Tests\PageType;

use Pike\ArrayUtils;
use Sivujetti\PageType\{PageTypeMigrator};
use Sivujetti\TheWebsite\TheWebsiteRepository;

final class DeletePageTypeTest extends PageTypesControllerTestCase {
    public function testDeletePlaceholderPageTypeDeletesPageTypeToDb(): void {
        $state = $this->setupTest();
        $this->insertPlaceholderPageTypeToDb();
        $this->makeTestSivujettiApp($state);
        $this->sendDeletePlaceholderPageTypeRequest($state);
        $this->verifyRequestReturnedSuccesfully($state);
        $this->verifyDeletePageTypeFromDb($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $state->spyingResponse = null;
        $state->app = null;
        return $state;
    }
    private function sendDeletePlaceholderPageTypeRequest(\TestState $state): void {
        $url = "/api/page-types/" . PageTypeMigrator::MAGIC_PAGE_TYPE_NAME . "/as-placeholder";
        $state->spyingResponse = $state->app->sendRequest($this->createApiRequest($url, "DELETE"));
    }
    private function verifyDeletePageTypeFromDb(\TestState $state): void {
        $all = (new TheWebsiteRepository())->fetchActive(new \Pike\Db\FluentDb(self::$db))->pageTypes;
        $actual = ArrayUtils::findByKey($all, PageTypeMigrator::MAGIC_PAGE_TYPE_NAME, "name");
        $this->assertNull($actual);
    }
}
