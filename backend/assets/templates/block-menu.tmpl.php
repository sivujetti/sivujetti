<?php
// @deprecated, see src/BlockType/MenuBlockType->render()
// Note: this block does not escape $props->* since they're pre-validated.
echo str_replace("{defaultAttrs}",
                 " class=\"j-" . \Sivujetti\Block\Entities\Block::TYPE_MENU .
                    ($props->styleClasses ? " {$this->escAttr($props->styleClasses)}" : "") .
                    "\" data-block-type=\"" . \Sivujetti\Block\Entities\Block::TYPE_MENU .
                    "\" data-block=\"{$props->id}\"",
                 $props->wrapStart),
    $this->partial("sivujetti:_menu-print-branch",
        array_merge((array) $props, ["branch" => json_decode($props->tree),
                                     "depth" => 0])),
    $this->renderChildren($props),
    $props->wrapEnd;
?>