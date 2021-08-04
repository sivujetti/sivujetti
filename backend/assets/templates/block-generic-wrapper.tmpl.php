<?php if ($props->type === \KuuraCms\Block\Entities\Block::TYPE_COLUMNS):
    echo "<div class=\"", $this->e($props->cssClass ?: "columns"), "\">",
        $this->renderChildren($props),
    "</div>";
elseif ($props->type === \KuuraCms\Block\Entities\Block::TYPE_SECTION):
    echo "<section class=\"", $this->e($props->cssClass), "\"",
        ($props->bgImage ? " style=\"background-image:url('".$this->assetUrl($props->bgImage)."')\"" : ""),
        ">",
        $this->renderChildren($props),
    "</section>";
else:
    [$startTag, $endTag] = !(KUURA_FLAGS & KUURA_DEVMODE) ? ["<!--", "-->"] : ["<div>", "</div>"];
    echo "{$startTag} kuura:block-generic-wrapper.tmpl.php: can only render TYPE_COLUMN|SECTIONs (your type was `{$props->type}`) {$endTag} ";
endif; ?>