<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <link rel="stylesheet" href="<?= $this->assetUrl("public/sivujetti/vendor/vendor.bundle.min.css") ?>">
        <link rel="stylesheet" href="<?= $this->assetUrl("public/sivujetti/sivujetti-edit-app.css") ?>">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title><?= $this->__($title) ?> - Sivujetti</title>
        <style>
        section {
            max-width: 440px;
            margin: 4rem auto 2rem auto;
            padding: 3rem 4rem 4rem;
            border-radius: 6px;
            background-color: rgba(244, 244, 247, .48);
        }
        </style>
    </head>
    <body>
        <section id="login-app"></section>
        <script src="<?= $this->assetUrl("public/sivujetti/vendor/vendor.bundle.min.js") ?>"></script>
        <script>window.sivujettiBaseUrl = '<?= $baseUrl ?>'; window.sivujettiAssetBaseUrl = ' ';</script>
        <script>window.translationStringBundles = []</script>
        <script src="<?= $this->assetUrl("public/sivujetti/lang-auth-fi.js") ?>"></script>
        <script src="<?= $this->assetUrl("public/sivujetti/sivujetti-commons.js") ?>"></script>
        <script src="<?= $this->assetUrl("public/sivujetti/sivujetti-render-auth-app.js") ?>"></script>
        <script>sivujettiRenderAuthApp('<?= $appName ?>')</script>
    </body>
</html>