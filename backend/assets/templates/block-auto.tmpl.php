<?php if ($props->type === \KuuraCms\Block\Entities\Block::TYPE_PARAGRAPH):
    echo "<p", ($props->cssClass ? " class=\"{$this->e($props->cssClass)}\"" : ''), ">",
        $props->text, // @allow pre-validated html
        ($props->children ? $this->renderBlocks($props->children) : ""),
    "</p>";
elseif ($props->type === \KuuraCms\Block\Entities\Block::TYPE_HEADING):
    $tag = "h{$this->e($props->level)}";
    echo "<{$tag}", ($props->cssClass ? " class=\"{$this->e($props->cssClass)}\"" : ''), ">",
        $this->e($props->text), // @allow pre-validated html
        ($props->children ? $this->renderBlocks($props->children) : ""),
    "</{$tag}>";
else:
    [$startTag, $endTag] = !(KUURA_FLAGS & KUURA_DEVMODE) ? ["<!--", "-->"] : ["<div>", "</div>"];
    echo "{$startTag} block-auto.tmpl.php: Don't know how to render custom page type `{$props->type}` {$endTag}";
endif; ?>