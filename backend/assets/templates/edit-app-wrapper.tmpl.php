<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <link rel="stylesheet" href="<?= $this->assetUrl("public/sivujetti/vendor/vendor.bundle.css") ?>">
        <link rel="stylesheet" href="<?= $this->assetUrl("public/sivujetti/sivujetti-edit-app.css") ?>">
    </head>
    <body>
        <div id="root" class="one-column-layout">
            <div id="main-panel"></div>
            <div id="inpector-panel"></div>
            <iframe src="<?= $this->url("{$url}?in-edit") ?>" id="sivujetti-site-iframe"></iframe>
        </div>
        <script src="<?= $this->assetUrl("public/sivujetti/vendor/vendor.bundle.min.js") ?>"></script>
        <script>window.dataFromAdminBackend = <?= $dataToFrontend ?></script>
        <script>window.translationStringBundles = []</script>
        <script src="<?= $this->assetUrl("public/sivujetti/lang-fi.js") ?>"></script>
        <script src="<?= $this->assetUrl("public/sivujetti/sivujetti-commons.js", /* @see frontend/commons/main.js */) ?>"></script>
        <script src="<?= $this->assetUrl("public/sivujetti/sivujetti-edit-app.js", /* @see frontend/edit-app/main.js */) ?>"></script>
        <?php foreach ($userDefinedJsFiles as $relUrl): ?>
            <script src="<?= $this->assetUrl("public/{$relUrl}") ?>"></script>
        <?php endforeach; ?>
    </body>
</html>