// Usage: npm start -- --configBundle main|website|all
//        npm start -- --configBundle myBundle (see docs/let's-create-a-custom-block-type.md)

const path = require('path');
const sucrase = require('@rollup/plugin-sucrase');

////////////////////////////////////////////////////////////////////////////////
const makeOutputCfg = (...myCfg) => {
    const out = Object.assign({format: 'iife'}, ...myCfg);
    if (!out.banner) out.banner =
`/*!
 * ${out.file.split('/').pop().split('.')[0]} 0.0.0
 * https://github.com/ut4/kuuracms
 * @license GPLv3
 */`;
    return out;
};

const makeJsxPlugin = () =>
    sucrase({
        production: true,
        include: [],
        transforms: ['jsx'],
        jsxPragma: 'preact.createElement',
        jsxFragmentPragma: 'preact.createFragment',
    });

const watchSettings = {
    clearScreen: false
};

////////////////////////////////////////////////////////////////////////////////
module.exports = args => {
    //
    const commonsPath = '@kuura-commons';
    const allGlobals = {[commonsPath]: 'kuuraCommons'};
    const allExternals = [commonsPath];
    const bundle = !args.configInput ? args.configBundle || 'main' : 'custom';
    const bundles = [];
    const selectedLang = args.configLang || 'fi';
    // == kuura-edit-app.js ====================================================
    if (bundle === 'main' || bundle === 'all') {
        bundles.push({
            input: 'frontend/edit-app/main.js',
            output: makeOutputCfg({
                name: 'kuuraEditApp',
                file: 'public/kuura/kuura-edit-app.js',
                globals: allGlobals,
            }),
            external: allExternals,
            plugins: [
                makeJsxPlugin(['frontend/edit-app/src/**']),
            ],
            watch: watchSettings
        });
    }
    // == lang-*.js ============================================================
    if (bundle === 'lang' || bundle === 'all') {
        bundles.push({
            input: `frontend/translations/${selectedLang}.js`,
            output: {
                format: 'iife',
                file: `public/kuura/lang-${selectedLang}.js`,
                globals: {'@kuura-string-bundles': 'translationStringBundles'},
            },
            external: ['@kuura-string-bundles'],
            watch: watchSettings
        });
    }
    // == kuura-webpage.js =====================================================
    if (bundle === 'webpage' || bundle === 'all')
        bundles.push({
            input: 'frontend/webpage/main.js',
            output: makeOutputCfg({
                file: 'public/kuura/kuura-webpage.js'
            }),
            watch: watchSettings
        });
    // == tests-bundled-main.js ================================================
    if (bundle === 'tests' || bundle === 'all') {
        bundles.push({
            input: 'frontend/tests/main.js',
            output: makeOutputCfg({file: 'public/tests/bundled-main.js'}),
            plugins: [makeJsxPlugin(['frontend/edit-app/src/**'])],
            watch: watchSettings
        });
    }
    // == custom.js ============================================================
    if (!bundles.length && bundle !== 'all') {
        const cfg = require(path.resolve(__dirname, args.configInput));
        const out = {
            input: cfg.input,
            output: makeOutputCfg({globals: allGlobals, banner: ''}, cfg.output),
            external: allExternals,
            plugins: [
                makeJsxPlugin(cfg.jsxTranspile
                    ? cfg.jsxTranspile.include || []
                    : []),
            ],
            watch: {
                clearScreen: false
            },
        };
        ['banner'].forEach(optionalKey => {
            if (cfg[optionalKey]) out[optionalKey] = cfg[optionalKey];
        });
        return out;
    }
    return bundles;
};
