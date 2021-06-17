<?php
// Lue lisää: https://todo/sivutemplaattien-käyttö.
?><!DOCTYPE html>
<html lang="<?= $site->lang ?>">
<head>
    <meta charset="utf-8">
    <title><?= "{$page->title} - {$site->name}" ?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="generator" content="KuuraCMS">
    <?= $this->cssFiles() ?>
    <style>
        .columns { display: flex; }
        .columns > section { flex: 1; }
    </style>
</head>
<body>
    <header>
        <h1 data-prop="title"><?= $this->e($page->title) ?></h1>
        <?= $this->MainMenu() ?>
    </header>
    <div id="main">
        <div class="columns">
            <?= $this->renderBlocks($page->blocks) ?>
        </div>
    </div>
    <?= $this->Footer() ?>
</body>
</html>