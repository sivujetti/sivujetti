<?php if ($props instanceof \KuuraCms\Block\Entities\Block):
    if ($props->type === \KuuraCms\Block\Entities\Block::TYPE_PARAGRAPH):
        echo "<p>{$this->e($props->text)}",$props->children?$this->renderBlocks($props->children):'',"</p>";
    elseif ($props->type === \KuuraCms\Block\Entities\Block::TYPE_HEADING):
        $hType = "h{$props->level}>";
        echo "<{$hType}{$this->e($props->text)}",$props->children?$this->renderBlocks($props->children):'',"</{$hType}";
    elseif ($props->type === \KuuraCms\Block\Entities\Block::TYPE_FORMATTED_TEXT):
        echo $props->html, // Allow pre-validated html
            $props->children?$this->renderBlocks($props->children):'';
    elseif ($props->type === \KuuraCms\Block\Entities\Block::TYPE_LISTING):
        if ($props->__pages): // Pages, Articles etc.
            foreach ($props->__pages as $entity):
                echo $this->renderBlocks($entity->blocks);
            endforeach;
        else:
            echo '<p>No "',json_decode($props->fetchFilters)->{'$all'}->{'$eq'}->pageType,'" found.</p>';// todo custom no results -page
        endif;
    else:
        echo !(KUURA_FLAGS & KUURA_DEVMODE)
            ? "<!-- Don't know how to render a custom page type `{$props->type}` -->" // allow unescaped
            : "<div>Don't know how to render a custom page type `{$props->type}`</div>";
    endif;
else:
    throw new \Pike\PikeException('cant render');
endif; ?>