<?php declare(strict_types=1);

namespace Sivujetti\Tests\Page;

use Pike\Request;

abstract class RenderPageTestCase extends PagesControllerTestCase {
    protected function insertTestPageToDb(\TestState $state): void {
        $this->pageTestUtils->insertPage($state->testPageData);
    }
    protected function sendRenderPageRequest(\TestState $state, bool $inEditMode = false): void {
        $state->spyingResponse = $state->app->sendRequest(
            new Request($state->testPageData->slug, "GET",
                body: null,
                files: null,
                serverVars: ["HTTP_HOST" => "localhost"],
                queryVars: !$inEditMode ? null : ["in-edit" => ""]
            ));
    }
}
