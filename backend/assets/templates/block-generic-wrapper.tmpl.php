<?php if ($props->type === \Sivujetti\Block\Entities\Block::TYPE_COLUMNS):
    echo "<div class=\"", $this->e($props->cssClass ?: "columns"), "\">",
        $this->renderChildren($props),
    "</div>";
elseif ($props->type === \Sivujetti\Block\Entities\Block::TYPE_SECTION):
    echo "<section class=\"", $this->e($props->cssClass), "\"",
        ($props->bgImage ? " style=\"background-image:url('{$this->assetUrl($props->bgImage)}')\"" : ""),
        "><div data-block-root>",
        $this->renderChildren($props),
    "</div></section>";
else:
    [$startTag, $endTag] = !(SIVUJETTI_FLAGS & SIVUJETTI_DEVMODE) ? ["<!--", "-->"] : ["<div>", "</div>"];
    echo "{$startTag} sivujetti:block-generic-wrapper.tmpl.php: can only render TYPE_COLUMN|SECTIONs (your type was `{$props->type}`) {$endTag} ";
endif; ?>