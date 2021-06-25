<?php declare(strict_types=1);

namespace KuuraCms\Installer\Tests;

use KuuraCms\Installer\App;
use Pike\{Request, TestUtils\HttpTestUtils};
use Pike\TestUtils\DbTestCase;

final class InstallFromDirTest extends DbTestCase {
    use HttpTestUtils;
    public function testInstallFromDirInstallsSiteFromLocalDirectory(): void {
        $app = $this->makeApp(fn() => App::create(self::setGetConfig()));
        $res = $app->sendRequest(new Request('/from-dir', 'POST'));
        $this->verifyResponseMetaEquals(200, 'application/json', $res);
        $this->assertEquals(json_encode((object) ['ok' => 'ok']),
                            $res->getActualBody());
    }
}
