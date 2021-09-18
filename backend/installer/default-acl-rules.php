<?php
use Sivujetti\Auth\ACL;
//
return function () {
$out = new \stdClass;
$out->resources = (object) [
    "blocks" => (object) [
        "create"         => 0b00000010,
        "render"         => 0b00000100,
    ],
    "coreUpdates" => (object) [
        "checkAvailable" => 0b00000010,
        "install"        => 0b00000100,
    ],
    "editMode" => (object) [
        "access"         => 0b00000010,
    ],
    "layouts" => (object) [
        "updateBlocksOf" => 0b00000010,
    ],
    "pages" => (object) [
        "create"         => 0b00000010,
        "updateBlocksOf" => 0b00000100,
        "update"         => 0b00001000,
    ],
    "uploads" => (object) [
        "view"           => 0b00000010,
    ],
];
$out->userPermissions = (object) [
    ACL::ROLE_ADMIN => (object) [
        "blocks"      => ACL::makePermissions("*", $out->resources->blocks),
        "coreUpdates" => ACL::makePermissions("*", $out->resources->coreUpdates),
        "editMode"    => ACL::makePermissions("*", $out->resources->editMode),
        "layouts"     => ACL::makePermissions("*", $out->resources->layouts),
        "pages"       => ACL::makePermissions("*", $out->resources->pages),
        "uploads"     => ACL::makePermissions("*", $out->resources->uploads),
    ]
];
return $out;
};