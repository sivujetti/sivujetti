<!DOCTYPE html>
<?= $this->head($currentPage) ?>
<body class="j-_body_" data-page-slug="<?= $currentPage->slug ?>">
    <?= $this->renderBlocks($currentPage->blocks),
        $this->jsFiles() ?>
</body>
</html>