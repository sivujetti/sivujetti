<?php
use Sivujetti\Auth\ACL;
//
return function () {
$out = new \stdClass;
$out->resources = (object) [
    "blocks" => (object) [
        "create"            => 0b00000010,
        "renderOrList"      => 0b00000100,
    ],
    "coreUpdates" => (object) [
        "checkAvailable"    => 0b00000010,
        "install"           => 0b00000100,
    ],
    "globalBlockTrees" => (object) [
        "create"            => 0b00000010,
        "read"              => 0b00000100,
        "updateBlocksOf"    => 0b00001000,
    ],
    "editMode" => (object) [
        "access"            => 0b00000010,
    ],
    "layouts" => (object) [
        "list"              => 0b00000010,
        "updateStructureOf" => 0b00000100,
    ],
    "pages" => (object) [
        "create"            => 0b00000010,
        "list"              => 0b00000100,
        "read"              => 0b00001000,
        "updateBlocksOf"    => 0b00010000,
        "update"            => 0b00100000,
    ],
    "pageTypes" => (object) [
        "create"            => 0b00000010,
        "update"            => 0b00000100,
        "delete"            => 0b00001000,
    ],
    "reusableBranches" => (object) [
        "create"           => 0b00000010,
        "list"             => 0b00000100,
    ],
    "themes" => (object) [
        "view"                      => 0b00000010,
        "updateGlobalStylesOf"      => 0b00000100,
        "upsertBlockTypeScopedVars" => 0b00001000,
        "upsertBlockTypeScopedCss"  => 0b00010000,
    ],
    "theWebsite" => (object) [
        "updateBasicInfoOf"         => 0b00000010,
    ],
    "uploads" => (object) [
        "view"              => 0b00000010,
        "upload"            => 0b00000100,
    ],
];
$out->userPermissions = (object) [
    ACL::ROLE_ADMIN => (object) [
        "blocks"            => ACL::makePermissions("*", $out->resources->blocks),
        "coreUpdates"       => ACL::makePermissions("*", $out->resources->coreUpdates),
        "globalBlockTrees"  => ACL::makePermissions("*", $out->resources->globalBlockTrees),
        "editMode"          => ACL::makePermissions("*", $out->resources->editMode),
        "layouts"           => ACL::makePermissions("*", $out->resources->layouts),
        "pages"             => ACL::makePermissions("*", $out->resources->pages),
        "pageTypes"         => ACL::makePermissions("*", $out->resources->pageTypes),
        "reusableBranches"  => ACL::makePermissions("*", $out->resources->reusableBranches),
        "themes"            => ACL::makePermissions("*", $out->resources->themes),
        "theWebsite"        => ACL::makePermissions("*", $out->resources->theWebsite),
        "uploads"           => ACL::makePermissions("*", $out->resources->uploads),
    ],
    ACL::ROLE_ADMIN_EDITOR => (object) [
        "blocks"            => ACL::makePermissions("*", $out->resources->blocks),
        "coreUpdates"       => ACL::makePermissions("*", $out->resources->coreUpdates),
        "globalBlockTrees"  => ACL::makePermissions("*", $out->resources->globalBlockTrees),
        "editMode"          => ACL::makePermissions("*", $out->resources->editMode),
        "layouts"           => ACL::makePermissions("*", $out->resources->layouts),
        "pages"             => ACL::makePermissions("*", $out->resources->pages),
        // pageTypes        -> none
        "reusableBranches"  => ACL::makePermissions("*", $out->resources->reusableBranches),
        "themes"            => ACL::makePermissions("*", $out->resources->themes),
        "theWebsite"        => ACL::makePermissions("*", $out->resources->theWebsite),
        "uploads"           => ACL::makePermissions("*", $out->resources->uploads),
    ],
    ACL::ROLE_EDITOR => (object) [
        "blocks"            => ACL::makePermissions("*", $out->resources->blocks),
        "coreUpdates"       => ACL::makePermissions("*", $out->resources->coreUpdates),
        "globalBlockTrees"  => ACL::makePermissions(["read","updateBlocksOf"], $out->resources->globalBlockTrees),
        "editMode"          => ACL::makePermissions(["access"], $out->resources->editMode),
        "layouts"           => ACL::makePermissions(["list"], $out->resources->layouts),
        "pages"             => ACL::makePermissions("*", $out->resources->pages),
        // pageTypes        -> none
        "reusableBranches"  => ACL::makePermissions("*", $out->resources->reusableBranches),
        "themes"            => ACL::makePermissions(["view","updateGlobalStylesOf","upsertBlockTypeScopedVars"], $out->resources->themes),
        "theWebsite"        => ACL::makePermissions(["updateBasicInfoOf"], $out->resources->theWebsite),
        "uploads"           => ACL::makePermissions("*", $out->resources->uploads),
    ],
    ACL::ROLE_AUTHOR => (object) [
        // blocks           -> none
        // coreUpdates      -> none
        // globalBlockTrees -> none
        "editMode"          => ACL::makePermissions(["access"], $out->resources->editMode),
        // layouts          -> none
        "pages"             => ACL::makePermissions(["list"], $out->resources->pages),
        // pageTypes        -> none
        // reusableBranches -> none
        // themes           -> none
        // theWebsite       -> none
        // uploads          -> none
    ]
];
return $out;
};