<?php declare(strict_types=1);

namespace Sivujetti\Tests\TheWebsite;

use Pike\{Injector, FileSystem};
use Sivujetti\JsonUtils;
use Sivujetti\Tests\Utils\{TestEnvBootstrapper};

final class ExportDataTest extends TheWebsiteControllerTestCase {
    public function testExportDataReturnsAllTheData(): void {
        $state = $this->setupATest();
        $this->makeExportTestSivujettiAppForExportTest($state);
        $this->sendExportDataRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyWroteFileThatContainsAllTheData($state);
    }
    protected function setupATest(): \TestState {
        $state = $this->setupTest();
        $state->actualEee = null;
        return $state;
    }
    public function makeExportTestSivujettiAppForExportTest(\TestState $state): void {
        $this->makeTestSivujettiApp($state, function (TestEnvBootstrapper $bootModule) use ($state) {
            $bootModule->useMockAlterer(function (Injector $di) use ($state) {
                $di->delegate(FileSystem::class, function() use ($state) {
                    /** @var \PHPUnit\Framework\MockObject\MockObject */
                    $stub = $this->createMock(FileSystem::class);
                    $stub->method("write")
                        ->with(
                            $this->anything(),
                            $this->callBack(function ($actualContents) use ($state) {
                                $state->actualEee = $actualContents;
                                return true;
                            })
                        )
                        ->willReturn(true);
                    return $stub;
                });
            });
        });
    }
    private function sendExportDataRequest(\TestState $state): void {
        $req = $this->createApiRequest("/api/the-website/export", "POST");
        $state->spyingResponse = $state->app->sendRequest($req);
    }
    private function verifyWroteFileThatContainsAllTheData(\TestState $state): void {
        $parsed = JsonUtils::parse($state->actualEee, flags: 0, asObject: false);
        $this->assertIsArray($parsed);
        $tableNames = array_column($parsed, "tableName");
        $this->assertEquals([
            "theWebsite",
            "themes",
            "themeStyles",
            "pageThemeStyles",
            "pageTypes",
            "PagesCategories",
            "Pages",
            "globalBlockTrees",
            "reusableBranches",
            "contentTemplates",
            "layouts",
            "files",
        ], $tableNames);
    }
}
