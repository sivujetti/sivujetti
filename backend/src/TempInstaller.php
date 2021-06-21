<?php declare(strict_types=1);

namespace KuuraCms;

use Pike\Db;

final class TempInstaller {
    public function __construct(object $appConfig, string $StratCls) {
        $db = new Db($appConfig);
        $db->open();
        $this->s = new $StratCls($db);
    }
    public function install(array $data): void {
        $this->s->recreateSchema();
        $this->s->up($data);
    }
}
