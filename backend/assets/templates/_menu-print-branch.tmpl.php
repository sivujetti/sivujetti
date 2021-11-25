<?php
// == <ul> ================
echo str_replace("{depth}", $props["depth"], $props["treeStart"]);
//
foreach ($props["branch"] as $i => $item) {
    // == <li> ================
    echo str_replace("{current}", $page && $page->slug === $item->slug ? " data-current" : "",
        str_replace("{depth}", $props["depth"], $props["itemStart"])
    );
    // == <a ...</a> ================
    echo "<a href=\"", $this->url($item->slug), "\"",
            $props["itemAttrs"] !== "[]"
                ? $this->attrMapToStr(json_decode($props["itemAttrs"], flags: JSON_THROW_ON_ERROR))
                : "",
        ">",
        $item->text,
    "</a>";
    if ($item->children) {
        echo $this->partial("sivujetti:_menu-print-branch",
            array_merge($props, ["branch" => $item->children,
                                 "depth" => $props["depth"] + 1]));
    }
    // == </li> ================
    echo $props["itemEnd"];
}
// == </ul> ================
echo $props["treeEnd"];
