<!DOCTYPE html>
<html lang="<?= $this->__($uiLang) ?>">
    <head>
        <meta charset="utf-8">
        <link rel="stylesheet" href="<?= $this->assetUrl("public/sivujetti/vendor/vendor.bundle.min.css") ?>">
        <link rel="stylesheet" href="<?= $this->assetUrl("public/sivujetti/vendor/jspanel-custom.min.css") ?>">
        <link rel="stylesheet" href="<?= $this->assetUrl("public/sivujetti/vendor/pickr-theme-nano.min.css") ?>">
        <link rel="stylesheet" href="<?= $this->assetUrl("public/sivujetti/sivujetti-edit-app.css") ?>">
        <?php if ($isFirstRun): ?>
        <?php if (defined("showIntroJsIntro")): ?>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/intro.js/4.3.0/introjs.min.css" integrity="sha512-YZO1kAqr8VPYJMaOgT4ZAIP4OeCuAWoZqgdvVYjeqyfieNWrUTzZrrxpgAdDrS7nV3sAVTKdP6MSKhqaMU5Q4g==" crossorigin="anonymous" referrerpolicy="no-referrer" />
        <?php endif; ?>
        <style>
        <?php if (defined("showIntroJsIntro")): ?>
        div:not(.introjsFloatingElement.introjs-showElement) + .introjs-overlay + .introjs-helperLayer {
            box-shadow: none !important;
            border: 4px solid var(--color-accent);
            transform: scale(.98) translate(-6px, -1px);
            z-index: 99999999;
        }
        .introjs-tooltip {
            margin-top: .6rem;
        }
        <?php endif; ?>
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
            padding-left: 2rem;
            z-index: 4;
        }
        .new-block-spawner-opened .drag-instructions-overlay:not(.fade-away) {
            opacity: 1;
        }
        .drag-instructions-overlay > div {
            position: relative;
            margin-top: 12rem;
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
            <iframe src="<?= $this->url("{$url}?in-edit") ?>" id="site-preview-iframe"></iframe>
        </div>
        <script src="<?= $this->assetUrl("public/sivujetti/vendor/vendor.bundle.min.js") ?>"></script>
        <script src="<?= $this->assetUrl("public/sivujetti/vendor/jspanel.min.js") ?>"></script>
        <script src="<?= $this->assetUrl("public/sivujetti/vendor/pickr.min.js") ?>"></script>
        <script src="<?= $this->assetUrl("public/sivujetti/vendor/stylis.min.js") ?>" async></script>
        <script src="<?= $this->assetUrl("public/sivujetti/vendor/popper.min.js") ?>" async></script>
        <script>window.isFirstRun = <?= $isFirstRun ? "true" : "false" ?></script>
        <script>window.dataFromAdminBackend = <?= $dataToFrontend ?></script>
        <script>window.translationStringBundles = []</script>
        <script src="<?= $this->assetUrl("public/sivujetti/lang-{$uiLang}.js") ?>"></script>
        <script src="<?= $this->assetUrl("public/sivujetti/sivujetti-commons-for-edit-app.js", /* @see frontend/commons-for-edit-app/main.js */) ?>"></script>
        <script src="<?= $this->assetUrl("public/sivujetti/sivujetti-edit-app.js", /* @see frontend/edit-app/main.js */) ?>"></script>
        <?php foreach ($userDefinedJsFiles as $relUrl): ?>
            <script src="<?= $this->assetUrl("public/{$relUrl}") ?>"></script>
        <?php endforeach; ?>
        <?php if ($isFirstRun && defined("showIntroJsIntro")): ?>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/intro.js/4.3.0/intro.min.js" integrity="sha512-WYNEDpX7FCz0ejmdUFl444n+v7gDgDFYmxy2YBx99v15UUk3zU5ZWYFBXFCvWYvd+nv/guwUnXmrecK7Ee0Wtg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
        <script>(function () {
            const startIntro = () => {
                const instance = introJs();
                instance.setOptions({
                    showProgress: true,
                    prevLabel: '<?= 'Edellinen' /*$this->__('Prev')*/ ?>',
                    nextLabel: '<?= 'Seuraava' /*$this->__('Next')*/ ?>',
                    doneLabel: '<?= 'Selvä!' /*$this->__('Done')*/ ?>',
                    showBullets: false,
                    scrollPadding: 100,
                    tooltipClass: 'customTooltip',
                    steps: [{
                        title: 'Moi! 👋',
                        intro: 'Tervetuloa sivustosi <b>muokkaustilaan</b>. Jos haluat lyhyen esittelyn muokkaustilan ominaisuuksista, klikkaa "Seuraava"!',
                    }, {
                        title: 'Päävalikko-paneeli',
                        element: document.querySelectorAll('#main-panel')[0],
                        intro: 'Tämän osion kautta <b>muokkaat sivustoasi</b>. Se päivittyy dynaamisesti kun navigoit sivustolla, ja se on aina näkyvillä.'
                    }, {
                        title: 'Lisätiedot-paneeli',
                        element: document.querySelector('#inspector-panel'),
                        intro: 'Tämä suljettava osio <b>näyttää sen sisällön tiedot</b>, jota olet juuri muokkaamassa.'
                    }, {
                        title: 'Sivusto',
                        element: document.getElementById('site-preview-iframe'),
                        intro: 'Sivuston sisältö päivittyy reaaliajassa, kun muokkaat sitä. <b>Kun klikkaat</b> sivun eri osioita, ne avautuu lisätiedot-paneeliin muokattavaksi.'
                    }, {
                        title: 'Lopettaminen',
                        element: document.querySelector('.mode-chooser .form-select'),
                        intro: 'Kun haluat poistua muokkaustilasta, voit tehdä sen tästä alasvetovalikosta.'
                    }]
                })
                instance.start();
            };
            let triedMs = 0;
            const waitMs = 100;
            const showIntroIfPageHasLoaded = () => {
                const firstBlock = document.querySelector('.block-tree .page-block .block-handle');
                if (firstBlock) {
                    firstBlock.click();
                    setTimeout(() => { startIntro(); }, 400);
                } else {
                    triedMs += waitMs;
                    if (triedMs <= 4000)
                        setTimeout(showIntroIfPageHasLoaded, waitMs);
                }
            };
            setTimeout(showIntroIfPageHasLoaded, waitMs);
        })()</script>
        <?php endif; ?>
    </body>
</html>