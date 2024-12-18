<?php declare(strict_types=1);

namespace Sivujetti\E2eTests;

use Pike\Db\FluentDb2;
use Pike\{Db, Injector, Router};

final class Module {
    /** @var array<string, mixed> */
    private array $config;
    /** @param array<string, mixed> $config */
    public function __construct(array $config) {
        $this->config = $config;
    }
    /**
     * Registers routes for the e2e utility app.
     *
     * @param \Pike\Router $router
     */
    public function init(Router $router): void {
        $router->map("PSEUDO:CLI", "/e2e-mode/begin/[*:bundleName]",
            [Controller::class, "beginE2eMode"]
        );
        $router->map("PSEUDO:CLI", "/e2e-mode/end",
            [Controller::class, "endE2eMode"]
        );
    }
    /**
     * @param \Pike\Injector $di
     */
    public function beforeExecCtrl(Injector $di): void {
        $fluentDb = new FluentDb2(new Db($this->config));
        $di->share($fluentDb);
        $fluentDb->getDb()->open();
    }
}
