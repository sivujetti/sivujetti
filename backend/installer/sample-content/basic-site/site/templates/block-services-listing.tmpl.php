<?php if ($props->__pages ?? null): ?>
    <?php foreach ($props->__pages as $page): $section = $page->blocks[0]; ?>
    <article <?= $section->bgImage ? " style=\"background-image:url('{$this->assetUrl("{$section->bgImage}")}')\"" : "" ?> class="list-item list-item-<?= $page->slug ?>">
        <h2><?= $page->title ?></h2>
        <a href="<?= $this->url("/{$props->__pageType->slug}{$page->slug}") ?>"><?= $this->__("Read more") ?></a>
    </article>
    <?php endforeach; ?>
<?php else: ?>
    <p><?= $this->__("No services found.") ?></p>
<?php endif; ?>