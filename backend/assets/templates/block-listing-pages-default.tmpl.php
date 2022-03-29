<?php
if ($props->__pages ?? null): ?>
<div class="listing listing-<?= strtolower($props->listPageType) ?>" data-block-type="<?= \Sivujetti\Block\Entities\Block::TYPE_LISTING ?>" data-block="<?= $props->id ?>">
    <?php foreach ($props->__pages as $page): ?>
    <article class="list-item list-item-<?= $page->slug ?>">
        <h2><?= $this->e($page->title) ?></h2>
        <div><a href="<?= $this->url(
            ($props->listPageType === "Pages" ? "" : $props->__pageType->slug) . $page->slug
        ) ?>"><?= $this->__("Read more") ?></a></div>
    </article>
    <?php endforeach; ?>
</div>
<?php else: ?>
    <p><?= $this->__("No %s found.", strtolower($props->__pageType->friendlyNamePlural)) ?></p>
<?php endif; ?>