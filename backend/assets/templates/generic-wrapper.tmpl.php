<?php if ($props->type === \KuuraCms\Entities\Block::TYPE_COLUMNS):
    echo '<div class="columns">',
        ($props->children ? $this->renderBlocks($props->children) : ''),
    '</div>';
elseif ($props->type === \KuuraCms\Entities\Block::TYPE_SECTION):
    echo '<section class="', $this->e($props->cssClass) ,'">',
        ($props->children ? $this->renderBlocks($props->children) : ''),
    '</section>';
else:
    echo !(KUURA_FLAGS & KUURA_DEVMODE)
        ? "<!-- generic-wrapper can only render TYPE_COLUMN|SECTION's (your type was `{$props->type}`) -->" // allow unescaped
        : "<div>generic-wrapper can only render TYPE_COLUMN|SECTION's (your type was `{$props->type}`)</div>";
endif; ?>