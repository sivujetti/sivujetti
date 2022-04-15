<!DOCTYPE html>
<?= $this->head($currentPage) ?>
<body data-page-slug="<?= $currentPage->slug ?>">
    <?= $this->renderBlocks($currentPage->blocks),
        $this->jsFiles() ?>
</body>
</html>