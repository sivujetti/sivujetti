<?php
use KuuraCms\Auth\ACL;
//
return function () {
$out = new \stdClass;
$out->resources = (object) [
    "blocks" => (object) [
        "create"         => 0b00000010,
        "render"         => 0b00000100,
    ],
    "editMode" => (object) [
        "access"         => 0b00000010,
    ],
    "pages" => (object) [
        "create"         => 0b00000010,
        "updateBlocksOf" => 0b00000100,
    ]
];
$out->userPermissions = (object) [
    ACL::ROLE_ADMIN => (object) [
        "blocks"   => ACL::makePermissions("*", $out->resources->blocks),
        "editMode" => ACL::makePermissions("*", $out->resources->editMode),
        "pages"    => ACL::makePermissions("*", $out->resources->pages),
    ]
];
return $out;
};