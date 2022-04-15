<?php declare(strict_types=1);

namespace Sivujetti\E2eTests;

use Pike\{Db, Request};
use Pike\TestUtils\DbTestCase;
use Sivujetti\FileSystem;

/**
 * @psalm-import-type TestDataBundle from \Sivujetti\E2eTests\TestDataBundles
 */
final class Controller {
    /**
     * `cli.php `: Creates a new sqlite database, populates it with $req->params->bundleName,
     * and overrides SIVUJETTI_INDEX_PATH . 'config.php' to use that db.
     */
    public function beginE2eMode(Request $req, TestDataBundles $dataBundles): void {
        $datas = $dataBundles->createBundle($req->params->bundleName);
        $statements = array_map(fn($itm) => self::dataToSql($itm), $datas);
        // Create db
        $config = require SIVUJETTI_BACKEND_PATH . "sivujetti/tests/config.php";
        // Override ":memory:"
        $config["db.database"] = E2E_TEST_DB_PATH;
        $db = new Db($config);
        // Populate it using $config["db.schemaInitFilePath"] and $statements
        DbTestCase::openAndPopulateTestDb($config, $db, $statements);

        // Monkeypatch config.php for upcoming e2e test requests
        $fs = (new \Pike\FileSystem);
        $pth = SIVUJETTI_INDEX_PATH . "config.php";
        $fs->copy($pth, "{$pth}.restore");
        $new = $fs->read(SIVUJETTI_BACKEND_PATH . "sivujetti/tests/config.php");
        $rep = str_replace(":memory:", E2E_TEST_DB_PATH, $new);
        $fs->write($pth, $rep);

        echo json_encode($datas);
    }
    /**
     * Deletes the sqlite database created in $this->beginE2eMode(), and restores
     * SIVUJETTI_INDEX_PATH . 'config.php'.
     */
    public function endE2eMode(FileSystem $fs): void {
        $fs = (new \Pike\FileSystem);
        $fs->unlink(E2E_TEST_DB_PATH);
        $fs->move(SIVUJETTI_INDEX_PATH . "config.php.restore", SIVUJETTI_INDEX_PATH . "config.php");
        echo json_encode(["ok" => "ok"]);
    }
    /**
     * @param TestDataBundle $item
     * @return string
     * @throws \RuntimeException
     */
    private static function dataToSql(array $item): string {
        if ($item["table"] === "Layouts") {
            $data = $item["data"];
            return sprintf("INSERT INTO `\${p}Layouts` VALUES ('%d','%s','%s','%s')",
                $data["id"],
                $data["friendlyName"],
                $data["relFilePath"],
                json_encode($data["structure"], flags: JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE),
            );
        }
        if ($item["table"] === "Pages") {
            $data = $item["data"];
            return sprintf("INSERT INTO `\${p}Pages` VALUES ('%s','%s','%s',%d,'%s','%s','%d','%s',%d)",
                $data["id"],
                $data["slug"],
                $data["path"],
                $data["level"],
                $data["title"],
                json_encode($data["meta"]),
                $data["layoutId"],
                json_encode($data["blocks"], flags: JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE),
                $data["status"]
            );
        }
        throw new \RuntimeException("No such table `{$item}`.");
    }
}
