<?php

return [
    "env" => [
        "BASE_URL"   => "/sivujetti/",
        "QUERY_VAR"  => "q",
        "SECRET"     => "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "UPDATE_KEY" => "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "DEVMODE"    => 1 << 1,
        "FLAGS"      => 1 << 1,
    ],
    "app" => [
        "db.driver" => "sqlite",
        "db.database" => ":memory:",
        "db.schemaInitFilePath" => __DIR__ . "/test-db-init.php",
    ]
];
