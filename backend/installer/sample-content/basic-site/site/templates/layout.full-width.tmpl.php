<?php
// Lue lisää: https://todo/sivutemplaattien-käyttö.
?><!DOCTYPE html>
<html lang="<?= $site->lang ?>">
<head>
    <meta charset="utf-8">
    <title><?= "{$page->title} - {$site->name}" ?></title>
    <meta name="generator" content="KuuraCMS">
    <?= $this->cssFiles() ?>
</head>
<body>
    <header>
        <h1 data-prop="title"><?= $this->e($page->title) ?></h1>
        <?= $this->MainMenu() ?>
    </header>
    <div id="main" data-section="main">
        <?= $this->renderBlocks($this->filterBlocks($page, 'main')) ?>
    </div>
    <?= $this->Footer() ?>
</body>
</html>