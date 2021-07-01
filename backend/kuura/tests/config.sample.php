<?php
if (!defined("KUURA_BASE_URL")) {
    define("KUURA_BASE_URL",       "/kuura/");
    define("KUURA_QUERY_VAR",      "");
    define("KUURA_BACKEND_PATH",   str_replace("\\", "/", dirname(__DIR__, 2)) . "/");
    define("KUURA_PUBLIC_PATH",    str_replace("\\", "/", dirname(KUURA_BACKEND_PATH)) . "/public/");
    define("KUURA_SECRET",         "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    define("KUURA_DEVMODE",        1 << 1);
    define("KUURA_FLAGS",          KUURA_DEVMODE);
}
return [
    "db.connPath" => "sqlite::memory:",
    "db.schemaInitFilePath" => __DIR__ . "/test-db-init.php",
];
