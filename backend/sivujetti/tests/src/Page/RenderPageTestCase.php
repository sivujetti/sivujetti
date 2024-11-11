<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use Pike\Request;
use Sivujetti\Page\WebPageAwareTemplate;
use Sivujetti\Tests\Utils\PluginTestCase;

abstract class RenderPageTestCase extends PagesControllerTestCase {
    protected function insertTestPageToDb(\TestState $state): void {
        $this->pageTestUtils->insertPage($state->testPageData);
    }
    protected function sendRenderPageRequest(\TestState $state, bool $inEditMode = false): void {
        $testEnvBootModule = $state->app->getApp()->getModules()[0];
        $state->spyingResponse = $state->app->sendRequest(
            new Request($state->testPageData->slug, "GET",
                body: null,
                files: null,
                serverVars: ["HTTP_HOST" => "localhost"],
                queryVars: !$inEditMode ? null : ["in-edit" => ""],
                // For skipAuthButLoadRequestUser
                cookies: array_key_exists("auth", $testEnvBootModule->mockConfigs)
                    ? ["PHPSESSID" => "--------------------------"]
                    : [],
            ));
    }
    protected static function makeUrl(...$args): string {
        return PluginTestCase::createTemplate()->makeUrl(...$args);
    }
}
