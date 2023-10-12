<?php
if (!defined("SIVUJETTI_BASE_URL")) {
    define("SIVUJETTI_BASE_URL",       "/sivujetti/");
    define("SIVUJETTI_QUERY_VAR",      "q");
    define("SIVUJETTI_SECRET",         "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    define("SIVUJETTI_UPDATE_KEY",     "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    define("SIVUJETTI_DEVMODE",        1 << 1);
    define("SIVUJETTI_FLAGS",          SIVUJETTI_DEVMODE);
}
return [
    "db.driver" => "sqlite",
    "db.database" => ":memory:",
    "db.schemaInitFilePath" => __DIR__ . "/test-db-init.php",
];
