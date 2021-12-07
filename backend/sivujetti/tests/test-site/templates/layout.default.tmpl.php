<!DOCTYPE html>
<html lang="<?= $site->lang ?>">
<head>
    <meta charset="utf-8">
    <title><?= "{$currentPage->title} - {$site->name}" ?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="generator" content="Sivujetti">
    <?= $this->cssFiles() ?>
</head>
<body data-page-slug="<?= $currentPage->slug ?>">
    <?= $this->renderBlocks($currentPage->blocks),
        $this->jsFiles() ?>
</body>
</html>