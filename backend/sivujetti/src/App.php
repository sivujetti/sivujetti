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
use Sivujetti\Theme\ThemesModule;
use Sivujetti\Update\UpdatesModule;
use Sivujetti\Upload\UploadsModule;

final class App extends PikeApp {
    public const VERSION = "0.11.0";
    /** @var \Pike\Injector */
    public static Injector $adi;
    /**
     * @param array<string, mixed>|\Sivujetti\Boot\BootModule $config
     */
    public function __construct(array|BootModule $config) {
        parent::__construct();
        $this->setModules([
            $config instanceof BootModule ? $config : new BootModule($config),
            new AuthModule,
            new BlocksModule,
            new GlobalBlockTreesModule,
            new LayoutsModule,
            new PageTypesModule,
            new ThemesModule,
            new UpdatesModule,
            new UploadsModule,
            new PagesModule,
            new PostBootModule,
        ])->defineInjectables(function ($di) {
            self::$adi = $di;
        });
    }
}
