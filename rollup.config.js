// Usage: npm start -- --configBundle main|website|all

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

////////////////////////////////////////////////////////////////////////////////
module.exports = args => {
    //
    const commonsPath = '@kuura-commons';
    const allGlobals = {[commonsPath]: 'kuuraCommons'};
    const allExternals = [commonsPath];
    const bundle = !args.configInput ? args.configBundle || 'main' : 'custom';
    const bundles = [];
    // == kuura-commons.js & kuura-cpanel-commons.js & kuura-edit-app.js =====
    if (bundle === 'main' || bundle === 'all') {
        bundles.push(...[/*{
            input: 'frontend/commons/main.js',
            output: makeOutputCfg({
                name: 'kuuraCommons',
                file: 'public/kuura/kuura-commons.js'
            }),
            plugins: [makeJsxPlugin()],
            watch: {clearScreen: false}
        }, {
            input: 'frontend/cpanel-commons/main.js',
            output: makeOutputCfg({
                name: 'kuuraCpanelCommons',
                file: 'public/kuura/kuura-cpanel-commons.js',
                globals: {[commonsPath]: 'kuuraCommons'},
            }),
            external: [commonsPath],
            plugins: [makeJsxPlugin([
                'frontend/cpanel-commons/src/**',
            ])],
            watch: {clearScreen: false}
        }, */{
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
            watch: {clearScreen: false}
        }]);
    }
    // == kuura-webpage.js =====================================================
    if (bundle === 'webpage' || bundle === 'all')
        bundles.push({
            input: 'frontend/webpage/main.js',
            output: makeOutputCfg({
                file: 'public/kuura/kuura-webpage.js'
            }),
            watch: {clearScreen: false}
        });
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
