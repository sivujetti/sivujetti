<div class="j-<?= \Sivujetti\Block\Entities\Block::TYPE_LISTING, " page-type-", strtolower($props->filterPageType), ($props->styleClasses ? " {$this->escAttr($props->styleClasses)}" : "") ?>" data-block-type="<?= \Sivujetti\Block\Entities\Block::TYPE_LISTING ?>" data-block="<?= $props->id ?>">
<?php if ($props->__pages ?? null): ?>
    <?php foreach ($props->__pages as $page): ?>
    <article class="list-item list-item-<?= $page->slug ?>">
        <h2><?= $this->e($page->title) ?></h2>
        <div><a href="<?= $this->url(
            ($props->filterPageType === "Pages" ? "" : $props->__pageType->slug) . $page->slug
        ) ?>"><?= $this->__("Read more") ?></a></div>
    </article>
    <?php endforeach; ?>
<?php else: ?>
    <p><?= $this->__("No %s found.", strtolower($props->__pageType->friendlyNamePlural)) ?></p>
<?php endif; ?>
<?= $this->renderChildren($props); ?>
</div>