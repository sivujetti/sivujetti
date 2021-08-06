<?php
if (!defined("SIVUJETTI_BASE_URL")) {
    define("SIVUJETTI_BASE_URL",       "/sivujetti/");
    define("SIVUJETTI_QUERY_VAR",      "");
    define("SIVUJETTI_BACKEND_PATH",   str_replace("\\", "/", dirname(__DIR__, 2)) . "/");
    define("SIVUJETTI_PUBLIC_PATH",    str_replace("\\", "/", dirname(SIVUJETTI_BACKEND_PATH)) . "/public/");
    define("SIVUJETTI_SECRET",         "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    define("SIVUJETTI_DEVMODE",        1 << 1);
    define("SIVUJETTI_FLAGS",          SIVUJETTI_DEVMODE);
}
return [
    "db.driver" => "sqlite",
    "db.database" => ":memory:",
    "db.schemaInitFilePath" => __DIR__ . "/test-db-init.php",
];
