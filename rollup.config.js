// Usage: npm start -- --configBundle main|webpage|all
//        npm start -- --configBundle myBundle (see docs/let's-create-a-custom-block-type.md)

const path = require('path');
const sucrase = require('@rollup/plugin-sucrase');
const {terser} = require('rollup-plugin-terser');

////////////////////////////////////////////////////////////////////////////////
const makeOutputCfg = (...myCfg) => {
    const out = Object.assign({format: 'iife'}, ...myCfg);
    if (!out.banner) out.banner =
`/*!
 * ${out.file.split('/').pop().split('.')[0]} 0.14.0
 * https://github.com/sivujetti/sivujetti
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
    const editAppCommonsPath = '@sivujetti-commons-for-edit-app';
    const editAppGlobals = {[editAppCommonsPath]: 'sivujettiCommonsEditApp'};
    const editAppExternals = [editAppCommonsPath];
    const webPagesCommonsPath = '@sivujetti-commons-for-web-pages';
    const webPagesGlobals = {[webPagesCommonsPath]: 'sivujettiCommonsForWebPages'};
    const webPageExternals = [webPagesCommonsPath];
    const bundle = !args.configInput ? args.configBundle || 'main' : 'custom';
    const bundles = [];
    const selectedLang = args.configLang || 'fi';
    const isBuild = args.w === undefined;
    const postPlugins = !isBuild ? [] : [terser()];
    const getTargetDirBase = input => {
        if (!input) return 'public/sivujetti/';
        if (input.indexOf('./') > -1)
            throw new Error(`Invalid directory ${input}`);
        return input;
    };
    const targetDirBase = getTargetDirBase(args.configTargetRelDir);
    // == sivujetti-edit-app.js ================================================
    if (bundle === 'main' || bundle === 'all') {
        bundles.push({
            input: 'frontend/commons-for-edit-app/main.js',
            output: makeOutputCfg({
                name: editAppGlobals[editAppCommonsPath],
                file: `${targetDirBase}sivujetti-commons-for-edit-app.js`,
            }),
            plugins: [
                makeJsxPlugin(['frontend/edit-app/src/**']),
            ].concat(...postPlugins),
            watch: watchSettings
        }, {
            input: 'frontend/edit-app/main.js',
            output: makeOutputCfg({
                name: 'sivujettiEditApp',
                file: `${targetDirBase}sivujetti-edit-app.js`,
                globals: editAppGlobals,
            }),
            external: editAppExternals,
            plugins: [
                makeJsxPlugin(['frontend/edit-app/src/**']),
            ].concat(...postPlugins),
            watch: watchSettings
        });
    }
    // == lang-*.js ============================================================
    if (bundle === 'lang' || bundle === 'all') {
        const globals = {'@sivujetti-string-bundles': 'translationStringBundles'};
        const external = ['@sivujetti-string-bundles'];
        bundles.push({
            input: `frontend/translations/${selectedLang}.js`,
            output: {
                format: 'iife',
                file: `${targetDirBase}lang-${selectedLang}.js`,
                globals,
            },
            external,
            plugins: postPlugins,
            watch: watchSettings
        }, {
            input: `frontend/translations/auth-apps.${selectedLang}.js`,
            output: {
                format: 'iife',
                file: `${targetDirBase}lang-auth-${selectedLang}.js`,
                globals,
            },
            external,
            plugins: postPlugins,
            watch: watchSettings
        });
    }
    // == sivujetti-webpage.js =================================================
    if (bundle === 'webpage' || bundle === 'all') {
        bundles.push({
            input: 'frontend/commons-for-web-pages/main.js',
            output: makeOutputCfg({
                name: webPagesGlobals[webPagesCommonsPath],
                file: `${targetDirBase}sivujetti-commons-for-web-pages.js`,
            }),
            plugins: postPlugins,
            watch: watchSettings
        }, {
            input: 'frontend/webpage/main.js',
            output: makeOutputCfg({
                file: `${targetDirBase}sivujetti-webpage.js`,
                globals: webPagesGlobals,
            }),
            external: webPageExternals,
            plugins: postPlugins,
            watch: watchSettings
        });
    }
    // == render-auth-app.js ===================================================
    if (bundle === 'auth' || bundle === 'all')
        bundles.push({
            input: 'frontend/auth-apps/renderAuthApp.js',
            output: makeOutputCfg({
                name: 'sivujettiRenderAuthApp',
                file: `${targetDirBase}sivujetti-render-auth-app.js`,
                globals: editAppGlobals,
            }),
            external: editAppExternals,
            plugins: [
                makeJsxPlugin(['frontend/edit-app/src/**']),
            ].concat(...postPlugins),
            watch: watchSettings
        });
    // == tests-bundled-main.js ================================================
    if (bundle === 'tests' || bundle === 'all') {
        bundles.push({
            input: 'frontend/tests/main.js',
            output: makeOutputCfg({
                file: 'public/tests/bundled-main.js',
                globals: editAppGlobals,
            }),
            plugins: [makeJsxPlugin(['frontend/edit-app/src/**'])].concat(...postPlugins),
            external: editAppExternals,
            watch: watchSettings
        });
    }
    // == custom.js ============================================================
    if (!bundles.length && bundle !== 'all') {
        let userDefined = require(path.resolve(__dirname, args.configInput));
        if (typeof userDefined === 'function') userDefined = userDefined({selectedLang});
        const cfgs = !Array.isArray(userDefined) ? [userDefined] : userDefined;
        //
        return cfgs.map(cfg => {
            const out = {
                input: cfg.input,
                output: makeOutputCfg({
                    globals: Object.assign({}, editAppGlobals, webPagesGlobals),
                    banner: ''
                }, cfg.output),
                plugins: [
                    makeJsxPlugin(cfg.jsxTranspile
                        ? cfg.jsxTranspile.include || []
                        : []),
                ].concat(...postPlugins),
                external: [...editAppExternals, ...webPageExternals],
                watch: {
                    clearScreen: false
                },
            };
            ['banner'].forEach(optionalKey => {
                if (cfg[optionalKey]) out[optionalKey] = cfg[optionalKey];
            });
            return out;
        });
    }
    return bundles;
};
