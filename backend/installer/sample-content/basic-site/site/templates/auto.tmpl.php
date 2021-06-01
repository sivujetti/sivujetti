<?php if ($props instanceof \KuuraCms\Entities\Block):
    if ($props->type === \KuuraCms\Entities\Block::TYPE_PARAGRAPH):
        echo "<p>{$this->e($props->text)}</p>";
    elseif ($props->type === \KuuraCms\Entities\Block::TYPE_HEADING):
        $hType = "h{$props->level}>";
        echo "<{$hType}{$this->e($props->text)}</{$hType}";
    elseif ($props->type === \KuuraCms\Entities\Block::TYPE_FORMATTED_TEXT):
        echo $props->html; // Allow pre-validated html
    elseif ($props->type === \KuuraCms\Entities\Block::TYPE_LISTING):
        foreach ($props->__pages as $page):
            echo $this->renderBlocks($page->blocks);
        endforeach;
    else:
        echo '<!-- Can\'t render -->';
    endif;
else:
    throw new \Pike\PikeException('cant render');
endif; ?>