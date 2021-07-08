<?php  if ($props->type === \KuuraCms\Block\Entities\Block::TYPE_PARAGRAPH):
    echo "<p>{$this->e($props->text)}</p>";
elseif ($props->type === \KuuraCms\Block\Entities\Block::TYPE_HEADING):
    $tag = "h{$this->e($props->level)}>";
    echo "<{$tag}{$this->e($props->text)}</{$tag}";
else:
    [$startTag, $endTag] = !(KUURA_FLAGS & KUURA_DEVMODE) ? ["<!--", "-->"] : ["<div>", "</div>"];
    echo "{$startTag} Don't know how to render custom page type `{$props->type}` {$endTag}";
endif; ?>