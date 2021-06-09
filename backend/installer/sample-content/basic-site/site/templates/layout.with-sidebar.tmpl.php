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
    <div id="main">
        <div class="columns" style="display:flex">
            <div class="main-column" style="flex:1" data-section="main">
                <?= $this->renderBlocks($this->filterBlocks($page, 'main')) ?>
            </div>
            <div class="aside-column" style="flex:1" data-section="sidebar">
                <?= $this->renderBlocks($this->filterBlocks($page, 'sidebar')) ?>
            </div>
        </div>
    </div>
    <footer>
        &copy; <?= $site->name ?> <?= date('Y') ?>
    </footer>
</body>
</html>