<?php if ($props->__pages ?? null): ?>
    <?php foreach ($props->__pages as $page): ?>
    <article class="list-item list-item-<?= $page->slug ?>">
        <h2><?= $page->title ?></h2>
        <a href="<?= $this->url("/{$props->__pageType->slug}{$page->slug}") ?>"><?= $this->__("Read more") ?></a>
    </article>
    <?php endforeach; ?>
<?php else: ?>
    <p><?= $this->__("No services found.") ?></p>
<?php endif; ?>