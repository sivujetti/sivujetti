<!DOCTYPE html>
<html lang="<?= $site->lang ?>">
<head>
    <meta charset="utf-8">
    <title><?= "{$page->title} - {$site->name}" ?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="generator" content="Sivujetti">
    <?= $this->cssFiles() ?>
</head>
<body data-page-slug="<?= $page->slug ?>">
    <?= $this->renderBlocks($page->blocks),
        $this->jsFiles() ?>
</body>
</html>