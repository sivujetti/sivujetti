<?php
if (!defined("SIVUJETTI_BASE_URL")) {
    define("SIVUJETTI_BASE_URL",       "/sivujetti/");
    define("SIVUJETTI_QUERY_VAR",      "");
    define("SIVUJETTI_SECRET",         "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    define("SIVUJETTI_DEVMODE",        1 << 1);
    define("SIVUJETTI_FLAGS",          SIVUJETTI_DEVMODE);
}
return [
    "db.driver" => "sqlite",
    "db.database" => ":memory:",
    "db.schemaInitFilePath" => __DIR__ . "/test-db-init.php",
];
