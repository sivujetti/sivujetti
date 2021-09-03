<?php
echo $props->wrapStart ?? "<nav class=\"menu\">",
    $this->partial("sivujetti:_menu-print-branch",
        array_merge((array) $props, ["branch" => json_decode($props->tree),
                                     "depth" => 0])),
    $props->wrapEnd ?? "</nav>";
?>