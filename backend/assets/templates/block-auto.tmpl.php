<?php if ($props->type === \Sivujetti\Block\Entities\Block::TYPE_PARAGRAPH):
    echo "<p", ($props->cssClass ? " class=\"{$this->e($props->cssClass)}\"" : ""),
        " data-block-type=\"", \Sivujetti\Block\Entities\Block::TYPE_PARAGRAPH, "\"",
        " data-block=\"{$props->id}\">",
        $props->text, // @allow pre-validated html
        $this->renderChildren($props),
    "</p>";
elseif ($props->type === \Sivujetti\Block\Entities\Block::TYPE_HEADING):
    $tag = "h{$this->e($props->level)}";
    echo "<{$tag}", ($props->cssClass ? " class=\"{$this->e($props->cssClass)}\"" : ""),
        " data-block-type=\"", \Sivujetti\Block\Entities\Block::TYPE_HEADING, "\"",
        " data-block=\"{$props->id}\">",
        $props->text, // @allow pre-validated html
        $this->renderChildren($props),
    "</{$tag}>";
elseif ($props->type === \Sivujetti\Block\Entities\Block::TYPE_IMAGE):
    echo "<span class=\"image", ($props->cssClass ? " {$this->e($props->cssClass)}" : ""), "\"",
        " data-block-type=\"", \Sivujetti\Block\Entities\Block::TYPE_IMAGE, "\"",
        " data-block=\"{$props->id}\">",
        "<img src=\"", !str_starts_with($props->src, "data:") ? $this->assetUrl($props->src) : $this->e($props->src), "\" alt=\"\">",
        $this->renderChildren($props),
    "</span>";
elseif ($props->type === \Sivujetti\Block\Entities\Block::TYPE_BUTTON):
    [$startInnerTag, $closeInnerTag] = match ($props->tagType) {
        "button" => ["<button type=\"button\"", "</button>"],
        "submit" => ["<button type=\"submit\"", "</button>"],
        default => ["<a href=\"{$this->maybeExternalUrl($props->linkTo)}\"", "</a>"],
    };
    echo "<p class=\"button\" data-block-type=\"", \Sivujetti\Block\Entities\Block::TYPE_BUTTON,
        "\" data-block=\"{$props->id}\">",
        $startInnerTag, " class=\"btn",
        ($props->cssClass ? " {$this->e($props->cssClass)}" : ""), "\"",
            " data-block-root>",
            $props->html, // @allow pre-validated html
            $this->renderChildren($props),
        $closeInnerTag,
    "</p>";
elseif ($props->type === \Sivujetti\Block\Entities\Block::TYPE_RICH_TEXT):
    echo $props->html, // @allow pre-validated html
         $this->renderChildren($props);
elseif ($props->type === \Sivujetti\Block\Entities\Block::TYPE_PAGE_INFO):
    echo "";
else:
    [$startTag, $endTag] = !(SIVUJETTI_FLAGS & SIVUJETTI_DEVMODE) ? ["<!--", "-->"] : ["<div>", "</div>"];
    echo "{$startTag} block-auto.tmpl.php: Don't know how to render custom block type `{$props->type}` {$endTag}";
endif; ?>