<!DOCTYPE html>
<html lang="<?= $site->lang ?>">
<head>
    <meta charset="utf-8">
    <title><?= "{$page->title} - {$site->name}" ?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="generator" content="KuuraCMS">
    <?= $this->cssFiles() ?>
</head>
<body>
    <header>
        <h1 data-prop="title"><?= $this->e($page->title) ?></h1>
        <?= $this->partial("MainMenu") ?>
    </header>
    <main class="columns">
        <div>Hello</div>
        <div class="aside-column">Sidebar</div>
    </main>
    <?= $this->partial("Footer") ?>
</body>
</html>