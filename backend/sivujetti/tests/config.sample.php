<?php

return [
    "env" => [
        "BASE_URL"       => "/sivujetti/",
        "QUERY_VAR"      => "q",
        "SITE_SECRET"    => "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "UPDATE_KEY"     => "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "UPDATE_CHANNEL" => "none",
    ],
    "app" => [
        "db.driver" => "sqlite",
        "db.database" => ":memory:",
        "db.schemaInitFilePath" => __DIR__ . "/test-db-init.php",
    ]
];
