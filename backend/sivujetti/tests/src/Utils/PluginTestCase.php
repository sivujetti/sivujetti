<?php declare(strict_types=1);

namespace Sivujetti\Tests\Utils;

use Pike\TestUtils\MutedSpyingResponse;
use Sivujetti\BlockType\BlockTypeInterface;
use Sivujetti\Template;
use Sivujetti\Tests\Page\RenderPageTestCase;
use TestState;

abstract class PluginTestCase extends RenderPageTestCase {
    protected BlockTestUtils $blockTestUtils;
    protected \TestState $state;
    protected array $useTheseMocks;
    protected ?\Closure $finalMocksAlterer;
    public static function createTemplate(): Template {
        return new Template("dummy", env: (require TEST_CONFIG_FILE_PATH)["env"]);
    }
    protected function setUp(): void {
        parent::setUp();
        $this->blockTestUtils = new BlockTestUtils;
        $this->state = new TestState;
        $this->useTheseMocks = [];
        $this->finalMocksAlterer = null;
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
     * @param string $name "auth"|"apiCtx"
     * @param array{":useAnonUser"?: boolean, ":userRole"?: int}|array{0: \Sivujetti\SharedAPIContext, ":session": \PHPUnit\Framework\MockObject\MockObject} $args
     * @return $this
     */
    protected function withMock(string $name, array $args): PluginTestCase {
        $this->useTheseMocks[] = [$name, $args];
        return $this;
    }
    /**
     * @param \Closure $alterer \Closure(\Sivujetti\Tests\Utils\TestEnvBootstrapper $bootModule): void
     * @return $this
     */
    protected function withBootModuleAlterer(\Closure $alterer): PluginTestCase {
        $this->finalMocksAlterer = $alterer;
        return $this;
    }
    /**
     * @param \Closure $useRequest = null \Closure(): \Pike\Request
     * @return \Pike\TestUtils\MutedSpyingResponse
     */
    protected function execute(\Closure $useRequest = null): MutedSpyingResponse {
        if (!$this->state->app)
            $this->makeTestSivujettiApp($this->state, function ($bootModule) {
                //
                foreach ($this->useTheseMocks as [$name, $args]) $bootModule->useMock($name, $args);
                //
                if ($this->finalMocksAlterer) $bootModule->useMockAlterer($this->finalMocksAlterer);
            });
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
