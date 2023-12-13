<?php declare(strict_types=1);

namespace Sivujetti;

use Pike\{App as PikeApp, Injector};
use Sivujetti\Auth\AuthModule;
use Sivujetti\Block\BlocksModule;
use Sivujetti\Boot\{BootModule, PostBootModule};
use Sivujetti\GlobalBlockTree\GlobalBlockTreesModule;
use Sivujetti\Layout\LayoutsModule;
use Sivujetti\Page\PagesModule;
use Sivujetti\PageType\PageTypesModule;
use Sivujetti\ReusableBranch\ReusableBranchesModule;
use Sivujetti\Theme\ThemesModule;
use Sivujetti\TheWebsite\TheWebsiteModule;
use Sivujetti\Update\UpdatesModule;
use Sivujetti\Upload\UploadsModule;

/**
 * @psalm-type EnvConstants = array{SIVUJETTI_BASE_URL: string, SIVUJETTI_QUERY_VAR: string, SIVUJETTI_SECRET: string, SIVUJETTI_UPDATE_KEY: string, SIVUJETTI_DEVMODE: int, SIVUJETTI_FLAGS: int} & array<string, mixed>
 * @psalm-type ConfigBundle = array{app: array<string, mixed>, env: EnvConstants}
 */
final class App extends PikeApp {
    public const VERSION = "0.16.0-dev";
    /**
     * @psalm-param ConfigBundle|\Sivujetti\Boot\BootModule $config
     */
    public function __construct(array|BootModule $config) {
        parent::__construct();
        [$module, $configBundle] = $config instanceof BootModule
            ? [$config,                 $config->configBundle]
            : [new BootModule($config), $config];
        $this->setModules([
            $module,
            new AuthModule,
            new BlocksModule,
            new GlobalBlockTreesModule,
            new LayoutsModule,
            new PageTypesModule,
            new ReusableBranchesModule,
            new ThemesModule,
            new TheWebsiteModule,
            new UpdatesModule,
            new UploadsModule,
            new PagesModule,
            new PostBootModule,
        ])->defineInjectables(function (Injector $di) use ($configBundle) {
            $appEnv = new AppEnv;
            $appEnv->constants = $configBundle["env"];
            $appEnv->di = $di;
            $di->share($appEnv);
        });
    }
}

final class AppEnv {
    /** @psalm-var EnvConstants */
    public array $constants;
    /** @var \Pike\Injector $di */
    public Injector $di;
}
