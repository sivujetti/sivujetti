<?php declare(strict_types=1);

namespace Sivujetti\Cli;

use Pike\App as PikeApp;

final class App extends PikeApp {
    /**
     * @param ?object $bootModule = null
     */
    public function __construct(?object $bootModule = null) {
        parent::__construct();
        $this->setModules(array_merge($bootModule ? [$bootModule] : [], [
            new Module,
        ]));
    }
}
