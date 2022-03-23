<?php declare(strict_types=1);

namespace Sivujetti\Cli;

use Pike\{App as PikeApp, FileSystem, Injector, Router};
use Pike\Interfaces\FileSystemInterface;

final class App extends PikeApp {
    /**
     * @param ?object $bootModule = null
     */
    public function __construct(?object $bootModule = null) {
        parent::__construct();
        $this->setModules([$bootModule ?? new class() {
            public function init(Router $_router) {
                //
            }
            public function beforeExecCtrl(Injector $di): void {
                $di->alias(FileSystemInterface::class, FileSystem::class);
            }
        }, new Module]);
    }
}
