<?php if ($props->type === \Sivujetti\Block\Entities\Block::TYPE_PARAGRAPH):
    echo "<p", ($props->cssClass ? " class=\"{$this->e($props->cssClass)}\"" : ""), ">",
        $props->text, // @allow pre-validated html
        $this->renderChildren($props),
    "</p>";
elseif ($props->type === \Sivujetti\Block\Entities\Block::TYPE_HEADING):
    $tag = "h{$this->e($props->level)}";
    echo "<{$tag}", ($props->cssClass ? " class=\"{$this->e($props->cssClass)}\"" : ""), ">",
        $props->text, // @allow pre-validated html
        $this->renderChildren($props),
    "</{$tag}>";
elseif ($props->type === \Sivujetti\Block\Entities\Block::TYPE_BUTTON):
    echo "<p><a href=\"" . (!str_contains($props->linkTo, ".")
        ? $this->makeUrl($props->linkTo)
        : (str_starts_with($props->linkTo, "//") || str_starts_with($props->linkTo, "http") ? "" : "//" . $props->linkTo)) .
        "\" class=\"btn",
        ($props->cssClass ? " {$this->e($props->cssClass)}" : ""),
        "\">{$props->html}{$this->renderChildren($props)}</a></p>"; // @allow pre-validated html
else:
    [$startTag, $endTag] = !(SIVUJETTI_FLAGS & SIVUJETTI_DEVMODE) ? ["<!--", "-->"] : ["<div>", "</div>"];
    echo "{$startTag} block-auto.tmpl.php: Don't know how to render custom page type `{$props->type}` {$endTag}";
endif; ?>