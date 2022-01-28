<?php declare(strict_types=1);

namespace Sivujetti\Tests\Utils;

use Pike\TestUtils\MutedSpyingResponse;
use Sivujetti\BlockType\BlockTypeInterface;
use Sivujetti\Tests\Page\RenderPageTestCase;
use TestState;

abstract class PluginTestCase extends RenderPageTestCase {
    protected BlockTestUtils $blockTestUtils;
    protected \TestState $state;
    protected function setUp(): void {
        parent::setUp();
        $this->blockTestUtils = new BlockTestUtils;
        $this->state = new TestState;
    }
    protected function setupRenderPageTest(): PluginTestCase {
        $this->state->testPageData = $this->pageTestUtils->makeTestPageData();
        $this->state->spyingResponse = null;
        $this->state->app = null;
        return $this;
    }
    protected function usePlugin(string $name): PluginTestCase {
        $this->dbDataHelper->insertData((object) ["name" => $name, "isActive" => true], "plugins");
        return $this;
    }
    protected function useBlockType(string $name, BlockTypeInterface $type): PluginTestCase {
        $this->testApiCtx->blockTypes->{$name} = $type;
        return $this;
    }
    protected function withPageData(\Closure $doMutateTestPageData): PluginTestCase {
        $doMutateTestPageData($this->state->testPageData);
        return $this;
    }
    protected function execute(): MutedSpyingResponse {
        $this->makeTestSivujettiApp($this->state);
        $this->insertTestPageToDb($this->state);
        $this->sendRenderPageRequest($this->state);
        return $this->state->spyingResponse;
    }
}
