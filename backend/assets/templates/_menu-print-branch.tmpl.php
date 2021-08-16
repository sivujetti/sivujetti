<?php
// == <ul> ================
if (!isset($props["treeStart"])) echo "<ul>";
else echo str_replace("{depth}", $props["depth"], $props["treeStart"]);
//
foreach ($props["branch"] as $i => $item) {
    // == <li> ================
    echo str_replace("{current}", $page && $page->slug === $item->slug ? " data-current" : "",
        !isset($props["itemStart"]) ? "" : str_replace(
                                               ["{i}", "{depth}"],
                                               [$i, $props["depth"]],
                                               $props["itemStart"]
                                           )
    );
    // == <a ...</a> ================
    echo "<a href=\"", $this->url($item->slug), "\"",
            isset($props["itemAttrs"]) ? $this->attrMapToStr($props["itemAttrs"]) : "", ">",
        $item->text,
    "</a>";
    if ($item->children) {
        echo $this->partial("sivujetti:_menu-print-branch",
            array_merge($props, ["branch" => $item->children,
                                 "depth" => $props["depth"] + 1]));
    }
    // == </li> ================
    echo $props["itemEnd"] ?? "</li>";
}
// == </ul> ================
echo $props["treeEnd"] ?? "</ul>";
