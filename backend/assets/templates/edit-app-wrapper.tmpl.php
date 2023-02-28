<!DOCTYPE html>
<html lang="<?= $this->__($uiLang) ?>">
    <head>
        <meta charset="utf-8">
        <link rel="stylesheet" href="<?= $this->assetUrl("public/sivujetti/vendor/vendor.bundle.min.css") ?>">
        <link rel="stylesheet" href="<?= $this->assetUrl("public/sivujetti/vendor/jspanel-custom.min.css") ?>">
        <link rel="stylesheet" href="<?= $this->assetUrl("public/sivujetti/vendor/pickr-theme-nano.min.css") ?>">
        <link rel="stylesheet" href="<?= $this->assetUrl("public/sivujetti/sivujetti-edit-app.css") ?>">
        <?php if ($isFirstRun): ?>
        <style>
        .drag-instructions-overlay {
            position: fixed;
            top: 0;
            left: 0;
            background: rgba(255,255,255,.64);
            height: 100%;
            backdrop-filter: blur(4px);
            display: flex;
            text-align: center;
            transition: opacity .625s;

            overflow: hidden;
            opacity: 0;
            width: 0;
        }
        .new-block-spawner-opened .drag-instructions-overlay {
            overflow: visible;
            padding-left: 4rem;
            z-index: 4;
        }
        .new-block-spawner-opened .drag-instructions-overlay:not(.fade-away) {
            opacity: 1;
        }
        .drag-instructions-overlay > div {
            position: relative;
            margin-top: 9rem;
        }
        .drag-instructions-overlay > div p {
            text-shadow: 0px 0px 4px #fff;
            font-size: .9rem;
            font-weight: bold;
            color: var(--color-fg-dimmed2);
        }
        .drag-instructions-overlay > div img {
            margin-left: -54px;
        }
        .drag-instructions-overlay > div button {
            right: 0;
            top: 4rem;
        }</style>
        <?php endif; ?>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="robots" content="noindex, nofollow, nosnippet, noarchive">
    </head>
    <body>
        <div id="root" class="one-column-layout">
            <div id="main-panel"></div>
            <div id="inspector-panel"></div>
            <div id="view"></div>
            <iframe src="" id="site-preview-iframe"></iframe>
            <span class="highlight-rect" data-position="top-outside"></span>
            <?php if ($isFirstRun && defined("showQuickIntro")): ?>
            <div style="opacity:0" id="quick-intro-outer">
            <div class="layer layer-0"></div>
            <h2 class="layer-4 quick-intro-head">Muokkaustila, pikaohje<button type="button" class="btn btn-link no-color"><svg class="icon-tabler size-xl" width="24" height="24" style="width: 28px;height: 28px;margin-top: -3px;"><use xlink:href="<?= $this->assetUrl("public/sivujetti/assets/tabler-sprite-custom.svg") ?>#tabler-x"></use></svg></button></h2>
            <div class="layer layer-1">
                <div id="target-end-edit-mode" class="third-end"></div>
                <div class="third-start">
                    <h2 id="connect-end-edit-mode"><span>3. Lopetus</span></h2>
                    <div>Valitse alasvetovalikosta "Kirjaudu ulos"</div>
                </div>
            </div>
            <div class="layer layer-2">
                <div class="second-end-outer">
                    <div id="target-preview" style="position: absolute; left: 50%"></div>
                </div>
                <div class="second-start">
                    <h2 id="connect-preview"><span>2. Esikatselu, navigointi</span></h2>
                    <div>Avaa muokkausvalikkoon klikkaamalla vihreää laatikkoa. <span style="font-size: .85em;">(Linkkien osalta: nopea klikkaus navigoi, pidempi painallus avaa muokkausvalikkoon.)</span></div>
                </div>
            </div>
            <div class="layer layer-3">
                <div id="target-edit-content" class="first-end"></div>
                <div class="first-start">
                    <h2 id="connect-edit-content"><span>1. Sisällön muokkaus</span></h2>
                    <div>Klikkaa, raahaa, kokeile</div>
                </div>
            </div>
            </div>
            <?php endif; ?>
        </div>

        <script src="<?= $this->assetUrl("public/sivujetti/vendor/vendor.bundle.min.js") ?>"></script>
        <script src="<?= $this->assetUrl("public/sivujetti/vendor/jspanel.min.js") ?>"></script>
        <script src="<?= $this->assetUrl("public/sivujetti/vendor/pickr.min.js") ?>"></script>
        <script src="<?= $this->assetUrl("public/sivujetti/vendor/stylis.min.js") ?>"></script>
        <script src="<?= $this->assetUrl("public/sivujetti/vendor/popper.min.js") ?>"></script>
        <script>window.isFirstRun = <?= $isFirstRun ? "true" : "false" ?></script>
        <script>window.dataFromAdminBackend = <?= $dataToFrontend ?></script>
        <script>window.translationStringBundles = []</script>
        <script src="<?= $this->assetUrl("public/sivujetti/lang-{$uiLang}.js") ?>"></script>
        <script src="<?= $this->assetUrl("public/sivujetti/sivujetti-commons-for-edit-app.js", /* @see frontend/commons-for-edit-app/main.js */) ?>"></script>
        <script src="<?= $this->assetUrl("public/sivujetti/sivujetti-edit-app.js", /* @see frontend/edit-app/main.js */) ?>"></script>
        <?php foreach ($userDefinedJsFiles as $relUrl): ?>
            <script src="<?= $this->assetUrl("public/{$relUrl}") ?>"></script>
        <?php endforeach; ?>
        <script>(function ({signals}) { signals.emit('edit-app-plugins-loaded'); })(sivujettiCommonsEditApp)</script>
    </body>
</html>