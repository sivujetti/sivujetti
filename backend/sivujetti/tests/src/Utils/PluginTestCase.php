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
    protected function setupPageTest(): PluginTestCase {
        $this->state->testPageData = $this->pageTestUtils->makeTestPageData();
        $this->state->spyingResponse = null;
        $this->state->app = null;
        return $this;
    }
    protected function setupRenderPageTest(): PluginTestCase {
        return $this->setupPageTest();
    }
    protected function usePlugin(string $name): PluginTestCase {
        $this->dbDataHelper->insertData((object) ["name" => $name, "isActive" => true], "plugins");
        return $this;
    }
    protected function useBlockType(string $name, BlockTypeInterface $type): PluginTestCase {
        $this->testApiCtx->blockTypes->{$name} = $type;
        return $this;
    }
    /**
     * @param \Closure $doMutateTestPageData \Closure(object $testPageData): void
     * @return $this
     */
    protected function withPageData(\Closure $doMutateTestPageData): PluginTestCase {
        $doMutateTestPageData($this->state->testPageData);
        return $this;
    }
    /**
     * @param \Closure $alterer \Closure(\Sivujetti\Tests\Utils\TestEnvBootstrapper $bootModule): void
     * @return $this
     */
    protected function withBootModuleAlterer(\Closure $alterer): PluginTestCase {
        $this->makeTestSivujettiApp($this->state, $alterer);
        return $this;
    }
    /**
     * @param \Closure $useRequest = null \Closure(): \Pike\Request
     * @return \Pike\TestUtils\MutedSpyingResponse
     */
    protected function execute(\Closure $useRequest = null): MutedSpyingResponse {
        if (!$this->state->app)
            $this->makeTestSivujettiApp($this->state);
        $this->insertTestPageToDb($this->state);
        if (!$useRequest) {
            $this->sendRenderPageRequest($this->state);
        } else {
            $req = $useRequest();
            $this->state->spyingResponse = $this->state->app->sendRequest($req);
        }
        return $this->state->spyingResponse;
    }
}
