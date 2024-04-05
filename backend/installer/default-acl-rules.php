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
        "install"           => 0b00000010,
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
        "delete"            => 0b01000000,
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
        "visuallyEditStylesOf"      => 0b00001000,
        "viaCssEditStylesOf"        => 0b00010000,
    ],
    "theWebsite" => (object) [
        "updateBasicInfoOf"         => 0b00000010,
        "updateGlobalScriptsOf"     => 0b00000100,
        "export"                    => 0b00001000,
    ],
    "uploads" => (object) [
        "list"              => 0b00000010,
        "view"              => 0b00000100,
        "upload"            => 0b00001000,
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
        "theWebsite"        => ACL::makePermissions(["updateBasicInfoOf","updateGlobalScriptsOf"], $out->resources->theWebsite),
        "uploads"           => ACL::makePermissions("*", $out->resources->uploads),
    ],
    ACL::ROLE_ADMIN_EDITOR => (object) [
        "blocks"            => ACL::makePermissions("*", $out->resources->blocks),
        "coreUpdates"       => ACL::makePermissions(["install"], $out->resources->coreUpdates),
        "globalBlockTrees"  => ACL::makePermissions("*", $out->resources->globalBlockTrees),
        "editMode"          => ACL::makePermissions("*", $out->resources->editMode),
        "layouts"           => ACL::makePermissions("*", $out->resources->layouts),
        "pages"             => ACL::makePermissions("*", $out->resources->pages),
        // pageTypes        -> none
        "reusableBranches"  => ACL::makePermissions("*", $out->resources->reusableBranches),
        "themes"            => ACL::makePermissions("*", $out->resources->themes),
        "theWebsite"        => ACL::makePermissions(["updateBasicInfoOf","updateGlobalScriptsOf"], $out->resources->theWebsite),
        "uploads"           => ACL::makePermissions("*", $out->resources->uploads),
    ],
    ACL::ROLE_EDITOR => (object) [
        "blocks"            => ACL::makePermissions("*", $out->resources->blocks),
        // coreUpdates      -> none
        "globalBlockTrees"  => ACL::makePermissions(["read","updateBlocksOf"], $out->resources->globalBlockTrees),
        "editMode"          => ACL::makePermissions(["access"], $out->resources->editMode),
        "layouts"           => ACL::makePermissions(["list"], $out->resources->layouts),
        "pages"             => ACL::makePermissions("*", $out->resources->pages),
        // pageTypes        -> none
        "reusableBranches"  => ACL::makePermissions("*", $out->resources->reusableBranches),
        "themes"            => ACL::makePermissions(["view","updateGlobalStylesOf","visuallyEditStylesOf"], $out->resources->themes),
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