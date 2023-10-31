<?php if ($props->type === \Sivujetti\Block\Entities\Block::TYPE_TEXT):
    echo "<div class=\"j-", $props->type, ($props->styleClasses ? " {$this->escAttr($props->styleClasses)}" : ""),
        "\" data-block-type=\"", $props->type,
        "\" data-block=\"", $props->id, "\">",
        $props->html, // @allow pre-validated html
        $this->renderChildren($props),
    "</div>";
elseif ($props->type === \Sivujetti\Block\Entities\Block::TYPE_IMAGE):
    echo "<figure class=\"j-", $props->type, ($props->styleClasses ? " {$this->escAttr($props->styleClasses)}" : ""),
        "\" data-block-type=\"", $props->type,
        "\" data-block=\"", $props->id,
        "\">",
        "<img src=\"", $props->src
            ? $this->mediaUrl("public/uploads/" . str_replace("/", "", $props->src))
            : \Sivujetti\BlockType\ImageBlockType::PLACEHOLDER_SRC,
        "\" alt=\"", $props->altText
            ? $this->escAttr($props->altText)
            : "",
        "\">",
        $props->caption
            ? "<figcaption>{$this->e($props->caption)}</figcaption>"
            : "",
        $this->renderChildren($props),
    "</figure>";
elseif ($props->type === \Sivujetti\Block\Entities\Block::TYPE_BUTTON):
    [$start, $close] = match ($props->tagType) {
        "button" => ["<button type=\"button\"", "</button>"],
        "submit" => ["<button type=\"submit\"", "</button>"],
        default => ["<a href=\"{$this->maybeExternalUrl($props->linkTo)}\"", "</a>"],
    };
    echo $start, " class=\"j-", $props->type, " btn", ($props->styleClasses ? " {$this->escAttr($props->styleClasses)}" : ""),
        "\" data-block-type=\"", $props->type,
        "\" data-block=\"", $props->id, "\">",
        $props->html, // @allow pre-validated html
        $this->renderChildren($props),
    $close;
elseif ($props->type === \Sivujetti\Block\Entities\Block::TYPE_CODE):
    echo "<div class=\"j-", $props->type, ($props->styleClasses ? " {$this->escAttr($props->styleClasses)}" : ""),
            "\" data-block-type=\"", $props->type,
            "\" data-block=\"", $props->id, "\">",
        $props->code
            ? $props->code // @allow raw html/css/js
            : $this->__("Waits for configuration ..."),
        $this->renderChildren($props),
    "</div>";
elseif ($props->type === \Sivujetti\Block\Entities\Block::TYPE_PAGE_INFO):
    echo "";
elseif ($props->type === \Sivujetti\Block\Entities\Block::TYPE_PARAGRAPH):
    echo "<p class=\"j-", $props->type, ($props->styleClasses ? " {$this->escAttr($props->styleClasses)}" : ""),
        "\" data-block-type=\"", $props->type,
        "\" data-block=\"", $props->id, "\">",
        $props->text, // @allow pre-validated html
        $this->renderChildren($props),
    "</p>";
elseif ($props->type === \Sivujetti\Block\Entities\Block::TYPE_HEADING):
    $whiteListed = [0, 1, 2, 3, 4, 5, 6][$props->level] ?? 6;
    echo "<h", $whiteListed, " class=\"j-", $props->type, ($props->styleClasses ? " {$this->escAttr($props->styleClasses)}" : ""),
        "\" data-block-type=\"", $props->type,
        "\" data-block=\"", $props->id, "\">",
        $props->text, // @allow pre-validated html
        $this->renderChildren($props),
    "</h", $whiteListed, ">";
elseif ($props->type === \Sivujetti\Block\Entities\Block::TYPE_RICH_TEXT):
    echo "<div class=\"j-", $props->type, ($props->styleClasses ? " {$this->escAttr($props->styleClasses)}" : ""),
            "\" data-block-type=\"", $props->type,
            "\" data-block=\"", $props->id, "\">",
        $props->html, // @allow pre-validated html
        $this->renderChildren($props),
    "</div>";
else:
    [$startTag, $endTag] = !(SIVUJETTI_FLAGS & SIVUJETTI_DEVMODE) ? ["<!--", "-->"] : ["<div>", "</div>"];
    echo $startTag, " block-auto.tmpl.php: Don't know how to render custom block type `", $this->e($props->type), "` ", $endTag;
endif; ?>