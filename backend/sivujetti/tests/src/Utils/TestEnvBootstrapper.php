<?php declare(strict_types=1);

namespace Sivujetti\Tests\Utils;

use PHPUnit\Framework\MockObject\MockObject;
use Pike\{AppConfig, Db, Injector, PikeException};
use Pike\Auth\Authenticator;
use Pike\Db\FluentDb2;
use Pike\Interfaces\SessionInterface;
use Pike\TestUtils\SingleConnectionDb;
use Sivujetti\Boot\BootModule;

/**
 * @psalm-import-type ConfigBundle from \Sivujetti\App
 */
class TestEnvBootstrapper extends BootModule {
    /** @var array<string, mixed> */
    public array $mockConfigs;
    /** @var ?\Pike\Db */
    protected ?Db $db;
    /** @var array<int, \Closure> */
    protected array $customAlterers;
    /**
     * @psalm-param ConfigBundle $configBundle
     * @param ?Db $db = null
     */
    public function __construct(array $configBundle, ?Db $db = null) {
        if ($db === null) throw new PikeException("Db is required");
        parent::__construct($configBundle);
        $this->db = $db;
        $this->mockConfigs = [];
        $this->customAlterers = [];
    }
    /**
     * @inheritdoc
     */
    protected function doLoadEssentials(Injector $di): void {
        $di->share(new AppConfig($this->configBundle["app"]));
        $di->share($this->db);
        $di->alias(Db::class, SingleConnectionDb::class);
        $di->share(new FluentDb2($this->db));
        //
        if (array_key_exists("auth", $this->mockConfigs)) {
            $args = $this->mockConfigs["auth"][1];
            $mockSession = $args[":session"];
            $di->delegate(SessionInterface::class, fn() => $mockSession);
            $di->share(new Authenticator(
                makeUserRepositoryFn: function ($_factory) { },
                makeSessionFn: fn() => $mockSession,
                makeRequestFn: function ($_factory) { },
                makeCookieStorageFn: function ($_factory) { },
                userRoleCookieName: "",
                doUseRememberMe: false
            ));
        }
        //
        if (array_key_exists("apiCtx", $this->mockConfigs)) {
            $di->share($this->mockConfigs["apiCtx"]);
        }
        //
        foreach ($this->customAlterers as $fn) {
            $fn($di);
        }
    }
    /**
     * @param string $name "auth"|"apiCtx"
     * @param array{":useAnonUser"?: boolean, ":userRole"?: int}|array{0: \Sivujetti\SharedAPIContext, ":session": \PHPUnit\Framework\MockObject\MockObject} $args
     * @return $this
     */
    public function useMock(string $name, array $args): TestEnvBootstrapper {
        if ($name === "auth") {
            if (!($args[":session"] instanceof MockObject))
                throw new PikeException("First arg of useMock(\"session\") must be " .
                    "PHPUnit\Framework\MockObject\MockObject",
                    PikeException::BAD_INPUT);
            $user = ($args[":useAnonUser"] ?? null) === true
                ? null
                : (object) ["id" => "1", "role" => $args[":userRole"] ?? 1];
            $args[":session"]->method("get")->with("user")->willReturn($user);
            $this->mockConfigs["auth"] = ["@auto", $args];
        } elseif ($name === "apiCtx") {
            $this->mockConfigs["apiCtx"] = $args[0];
        } else {
            throw new PikeException("");
        }
        return $this;
    }
    /**
     * @param \Closure $fn
     * @return $this
     */
    public function useMockAlterer(\Closure $fn): TestEnvBootstrapper {
        $this->customAlterers[] = $fn;
        return $this;
    }
}
