<section class="<?= $this->e($props->cssClass) ?>">
    <?= $props->children ? $this->renderBlocks([$props->children]) : '' ?>
</section>