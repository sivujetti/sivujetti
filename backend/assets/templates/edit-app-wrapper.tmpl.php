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
        <?php if (defined("showQuickIntro")): ?>
        #quick-intro-outer {
            --bg: #fff;
            color:var(--color-fg-default);
            position: fixed;
            width: 100%;
            height: 100%;
            background-color: rgb(255 255 255 / 48%);
            backdrop-filter: blur(4px);
            z-index: 2;
            min-width: 885px;
        }
        .quick-intro-head {
            position: absolute;
            right: 2rem;
            font-size: 2rem;
            top: 2rem;
            color: #00093e;
            z-index: 1;
        }
        #quick-intro-outer .box {
            position: absolute;
            position: absolute;
            background: var(--bg);
            border: 2px solid var(--color-fg-default);
            font-size: .75rem;
            padding: .4rem .4rem .3rem;
            font-size: .8rem;
        }
        #quick-intro-outer .box > div {
            max-width: 400px;
        }
        #quick-intro-outer .box.third > div {
            max-width: 200px;
        }
        #quick-intro-outer .box h2 {
            display: inline-block;
            margin: -.5rem 0 .7rem 0;
        }
        #quick-intro-outer .box h2 span {
            background-color: #ffff7b;
            padding: 0 .6rem;
        }

        .box.first {
            left: 80px;
            top: 32%;
        }

        .second-outer {
            position: absolute;
            left: 318px;
            width: calc(100% - 318px);
            height: 100%;
        }
        .box.second {
            left: 50%;
            top: 58%;
            margin-left: -210px;
        }

        .box.third {
            top: 28px;
            left: 126px;
        }

        .first:before,
        .first:after,
        .second:before,
        .second:after,
        .third:before,
        .third:after {
            content: "";
            position: absolute;
            height: 0;
            width: 0;
        }
        .first:before {
            --w: 13px;
            border-left: var(--w) solid var(--color-fg-default);
            border-bottom: var(--w) solid transparent;
            border-right: var(--w) solid transparent;
            border-top: var(--w) solid var(--color-fg-default);
            bottom: -26px;
            left: -2px;
        }
        .first:after {
            --w: 11px;
            border-left: var(--w) solid var(--bg);
            border-bottom: var(--w) solid transparent;
            border-right: var(--w) solid transparent;
            border-top: var(--w) solid var(--bg);
            bottom: -21px;
            left: 0px;
        }
        .second:before {
            --h: 22px;
            --w: 17px;
            border-left: var(--w) solid transparent;
            border-bottom: var(--h) solid transparent;
            border-right: var(--w) solid transparent;
            border-top: var(--h) solid var(--color-fg-default);
            bottom: calc(var(--h) * 2 * -1);
            left: 50%;
            margin-left: -20px;
        }
        .second:after {
            --h: 19px;
            --w: 15px;
            border-left: var(--w) solid transparent;
            border-bottom: var(--h) solid transparent;
            border-right: var(--w) solid transparent;
            border-top: var(--h) solid var(--bg);
            bottom: calc(var(--h) * 2 * -1);
            left: 50%;
            margin-left: -18px;
        }
        .third:before {
            --w: 13px;
            border-left: var(--w) solid transparent;
            border-bottom: var(--w) solid transparent;
            border-right: var(--w) solid var(--color-fg-default);
            border-top: var(--w) solid var(--color-fg-default);
            top: -2px;
            left: -26px;
        }
        .third:after {
            --w: 11px;
            border-left: var(--w) solid transparent;
            border-bottom: var(--w) solid transparent;
            border-right: var(--w) solid var(--bg);
            border-top: var(--w) solid var(--bg);
            top: 0;
            left: -22px;
        }
        .close-additional {
            position: fixed;
            bottom: .6rem;
            left: .4rem;
            opacity: .7;
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
            <div style="opacity:0" id="quick-intro-outer"><div>
                <h2 class="quick-intro-head">Muokkaustila, pikaohje<button type="button" class="btn btn-link no-color"><svg class="icon-tabler size-xl" width="24" height="24" style="width: 28px;height: 28px;margin-top: -3px;"><use xlink:href="<?= $this->assetUrl("public/sivujetti/assets/tabler-sprite-custom.svg") ?>#tabler-x"></use></svg></button></h2>
                <div class="box first">
                    <h2 id="connect-edit-content"><span>1. Sisällön muokkaus</span></h2>
                    <div>Klikkaa, raahaa, kokeile</div>
                </div>
                <div class="second-outer"><div class="box second">
                    <h2 id="connect-preview"><span>2. Esikatselu, navigointi</span></h2>
                    <div>Avaa sisältö muokattavaksi klikkaamalla tekstiä, kuvaa jne. <span style="font-size: .85em;">(Linkkien osalta: klikkaa hieman pidempään, nopea klikkaus navigoi.)</span></div>
                </div></div>
                <div class="box third">
                    <h2 id="connect-end-edit-mode"><span>3. Lopetus</span></h2>
                    <div>Valitse alasvetovalikosta "Kirjaudu ulos"</div>
                </div>
                <button type="button" class="close-additional btn btn-link no-color flex-centered"><svg width="24" height="24" style="width: 20px;height: 20px;" class="icon-tabler mr-2"><use xlink:href="<?= $this->assetUrl("public/sivujetti/assets/tabler-sprite-custom.svg") ?>#tabler-x"></use></svg>Sulje</button>
            </div></div>
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
        <?php if ($isFirstRun && defined("showQuickIntro")): ?>
        <script>(function () {
        const onPreviewIframeLoad = () => {
            document.getElementById('quick-intro-outer').style.opacity = 1;
            document.getElementById('site-preview-iframe').removeEventListener('load', onPreviewIframeLoad);
            Array.from(document.querySelectorAll('#quick-intro-outer .btn')).forEach(el => el.addEventListener('click', () => {
                const el = document.getElementById('quick-intro-outer');
                el.parentElement.removeChild(el);
            }));
        };
        document.getElementById('site-preview-iframe').addEventListener('load', onPreviewIframeLoad);
        })()</script>
        <?php endif; ?>
    </body>
</html>