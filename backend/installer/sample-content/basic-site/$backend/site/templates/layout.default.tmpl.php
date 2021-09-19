<!DOCTYPE html>
<html lang="<?= $site->lang ?>">
<head>
    <meta charset="utf-8">
    <title><?= "{$page->title} - {$site->name}" ?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="generator" content="Sivujetti">
    <?= $this->cssFiles() ?>
</head>
<body>
    <header>
        <h1 data-prop="title"><?= $this->e($page->title) ?></h1>
        <?= $this->partial("MainMenu") ?>
    </header>
    <?= $this->renderBlocks($page->blocks),
        $this->partial("Footer") ?>
</body>
</html>