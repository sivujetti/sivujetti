<?php declare(strict_types=1);

namespace Sivujetti\E2eTests;

use Pike\{Db, DbUtils, Request};
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
        $datas = $dataBundles->createBundle(urldecode($req->params->bundleName));
        $statements = [];
        foreach ($datas as $itm) $statements = array_merge($statements, self::dataToSqlStatements($itm));
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
        $possibleCssFile = SIVUJETTI_INDEX_PATH . "public/test-suite-theme-generated.css";
        if ($fs->isFile($possibleCssFile)) $fs->unlink($possibleCssFile);
        echo json_encode(["ok" => "ok"]);
    }
    /**
     * @psalm-param TestDataBundle $item
     * @return string
     * @throws \RuntimeException
     */
    private static function dataToSqlStatements(array $item): array {
        if ($item["table"] === "Layouts") {
            $data = $item["data"];
            return [sprintf("INSERT INTO `\${p}Layouts` VALUES ('%d','%s','%s','%s')",
                $data["id"],
                $data["friendlyName"],
                $data["relFilePath"],
                json_encode($data["structure"], flags: JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE),
            )];
        }
        if ($item["table"] === "Pages") {
            $table = $item["table"];
            $data = $item["data"];
            $now = time();
            return [sprintf("INSERT INTO `\${p}{$table}` VALUES ('%s','%s','%s','%s',%d,'%s','%s','%d','%s',%d,%d,%d)",
                $data["id"],
                $data["slug"],
                $data["path"],
                $data["categories"],
                $data["level"],
                $data["title"],
                json_encode($data["meta"]),
                $data["layoutId"],
                json_encode($data["blocks"], flags: JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE),
                $data["status"],
                $now,
                $now
            )];
        }
        if ($item["table"] === "Articles" || $item["table"] === "PagesCategories") {
            $table = $item["table"];
            $data = $item["data"];
            $now = time();
            return [sprintf("INSERT INTO `\${p}{$table}` VALUES ('%s','%s','%s',%d,'%s','%s','%d','%s',%d,%d,%d)",
                $data["id"],
                $data["slug"],
                $data["path"],
                $data["level"],
                $data["title"],
                json_encode($data["meta"]),
                $data["layoutId"],
                json_encode($data["blocks"], flags: JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE),
                $data["status"],
                $now,
                $now
            )];
        }
        if ($item["table"] === "@create" && $item["data"]["name"] === "Articles") {
            $data = $item["data"];
            $dataTypeForTimestamps = "INTEGER NOT NULL DEFAULT 0";
            return [
                "CREATE TABLE `Articles` (
                    `id` INTEGER PRIMARY KEY AUTOINCREMENT,
                    `slug` TEXT NOT NULL,
                    `path` TEXT,
                    `level` INTEGER NOT NULL DEFAULT 1,
                    `title` TEXT NOT NULL,
                    `meta` JSON,
                    `layoutId` TEXT NOT NULL,
                    `blocks` JSON,
                    `status` INTEGER NOT NULL DEFAULT 0,
                    `createdAt` {$dataTypeForTimestamps},
                    `lastUpdatedAt` {$dataTypeForTimestamps}
                )",
                sprintf("INSERT INTO `pageTypes` (name,slug,friendlyName,friendlyNamePlural" .
                    ",description,fields,defaultLayoutId,status,isListable) VALUES " .
                    "('%s','%s','%s',%d,'%s','%s','%s','%s',%d)",
                    $data["name"],
                    $data["slug"],
                    $data["friendlyName"],
                    $data["friendlyNamePlural"],
                    $data["description"],
                    json_encode($data["fields"], flags: JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE),
                    $data["defaultLayoutId"],
                    $data["status"],
                    $data["isListable"],
                )
            ];
        }
        throw new \RuntimeException("No such table `{$item}`.");
    }
}
