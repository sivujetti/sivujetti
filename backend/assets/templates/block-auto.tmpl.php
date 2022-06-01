<?php if ($props->type === \Sivujetti\Block\Entities\Block::TYPE_PARAGRAPH):
    echo "<p", ($props->cssClass ? " class=\"{$this->e($props->cssClass)}\"" : ""),
        " data-block-type=\"", \Sivujetti\Block\Entities\Block::TYPE_PARAGRAPH, "\"",
        " data-block=\"", $props->id, "\">",
        $props->text, // @allow pre-validated html
        $this->renderChildren($props),
    "</p>";
elseif ($props->type === \Sivujetti\Block\Entities\Block::TYPE_HEADING):
    $whiteListed = [0, 1, 2, 3, 4, 5, 6][$props->level] ?? 6;
    echo "<h", $whiteListed, ($props->cssClass ? " class=\"{$this->e($props->cssClass)}\"" : ""),
        " data-block-type=\"", \Sivujetti\Block\Entities\Block::TYPE_HEADING, "\"",
        " data-block=\"", $props->id, "\">",
        $props->text, // @allow pre-validated html
        $this->renderChildren($props),
    "</h", $whiteListed, ">";
elseif ($props->type === \Sivujetti\Block\Entities\Block::TYPE_IMAGE):
    echo "<figure", ($props->cssClass ? " class=\"{$this->e($props->cssClass)}\"" : ""),
        " data-block-type=\"", \Sivujetti\Block\Entities\Block::TYPE_IMAGE, "\"",
        " data-block=\"", $props->id, "\">",
        "<img src=\"", $props->src
            ? $this->assetUrl("public/uploads/" . str_replace("/", "", $props->src))
            : \Sivujetti\BlockType\ImageBlockType::PLACEHOLDER_SRC, "\" alt=\"\">",
        $this->renderChildren($props),
    "</figure>";
elseif ($props->type === \Sivujetti\Block\Entities\Block::TYPE_BUTTON):
    [$startInnerTag, $closeInnerTag] = match ($props->tagType) {
        "button" => ["<button type=\"button\"", "</button>"],
        "submit" => ["<button type=\"submit\"", "</button>"],
        default => ["<a href=\"{$this->maybeExternalUrl($props->linkTo)}\"", "</a>"],
    };
    echo "<p class=\"button\" data-block-type=\"", \Sivujetti\Block\Entities\Block::TYPE_BUTTON,
        "\" data-block=\"", $props->id, "\">",
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
    echo $startTag, " block-auto.tmpl.php: Don't know how to render custom block type `", $this->e($props->type), "` ", $endTag;
endif; ?>