<?php
// Lue lisää: https://todo/sivutemplaattien-käyttö.
?><!DOCTYPE html>
<html lang="<?= $site->lang ?>">
<head>
    <meta charset="utf-8">
    <title><?= "{$page->title} - {$site->name}" ?></title>
    <meta name="generator" content="KuuraCMS <?= KUURA_VERSION ?>">
    <?= $this->cssFiles() ?>
</head>
<body>
    <header>
        <h1><?= $page->title ?></h1>
        <?= $this->MainMenu() ?>
    </header>
    <div id="main">
        <?php if ($page): ?>
            <div class="columns" style="display:flex">
                <div class="main-column" style="flex:1" data-section="main">
                    <?= $this->renderBlocks($this->filterBlocks($page, 'main')) ?>
                </div>
                <div class="aside-column" style="flex:1;width:300px" data-section="sidebar">
                    <?= $this->renderBlocks($this->filterBlocks($page, 'sidebar')) ?>
                </div>
            </div>
        <?php else: ?>
            <h2>404</h2>
            <div>404</div>
        <?php endif; ?>
    </div>
    <footer>
        &copy; <?= $site->name ?> <?= date('Y') ?>
    </footer>
</body>
</html>