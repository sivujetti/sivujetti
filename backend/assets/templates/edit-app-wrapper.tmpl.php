<!DOCTYPE html>
<html lang="fi">
    <head>
        <meta charset="utf-8">
        <link rel="stylesheet" href="<?= $this->assetUrl('public/kuura/vendor/vendor.bundle.css') ?>">
        <link rel="stylesheet" href="<?= $this->assetUrl('public/kuura/kuura-edit-app.css') ?>">
    </head>
    <body>
        <div id="root">
            <div id="doos"></div>
            <iframe src="<?= $this->url("{$url}?in-edit") ?>" id="kuura-site-iframe"></iframe>
        </div>
        <script src="<?= $this->assetUrl('public/kuura/vendor/vendor.bundle.min.js') ?>"></script>
        <script src="<?= $this->assetUrl('public/kuura/kuura-edit-app.js', /* @see frontend/edit-app/main.js */) ?>"></script>
        <?php foreach ($userDefinedJsFiles as $relUrl): ?>
            <script src="<?= $this->assetUrl("public/{$relUrl}") ?>"></script>
        <?php endforeach; ?>
    </body>
</html>