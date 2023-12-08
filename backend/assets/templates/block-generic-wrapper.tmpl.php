<?php if ($props->type === \Sivujetti\Block\Entities\Block::TYPE_COLUMNS):
    echo "<div class=\"j-", $props->type, " num-cols-", $this->e($props->numColumns),
        ($props->takeFullWidth ? "" : " inline"),
        (!$props->styleClasses ? "" : " {$this->escAttr($props->styleClasses)}"),
        "\" data-block-type=\"", $props->type,
        "\" data-block=\"{$props->id}\">",
        $this->renderChildren($props),
    "</div>";
elseif ($props->type === \Sivujetti\Block\Entities\Block::TYPE_SECTION):
    echo "<section class=\"j-", $props->type, ($props->styleClasses ? " {$this->escAttr($props->styleClasses)}" : ""), "\"",
        ($props->bgImage ? " style=\"background-image:url('{$this->maybeExternalMediaUrl($props->bgImage)}')\"" : ""),
        " data-block-type=\"", $props->type,
        "\" data-block=\"{$props->id}\"><div data-block-root>",
        $this->renderChildren($props),
    "</div></section>";
else:
    [$startTag, $endTag] = !(SIVUJETTI_FLAGS & SIVUJETTI_DEVMODE) ? ["<!--", "-->"] : ["<div>", "</div>"];
    echo $startTag, " sivujetti:block-generic-wrapper.tmpl.php: can only render TYPE_COLUMN|SECTIONs (your type was `", $this->e($props->type), "`) ", $endTag;
endif; ?>