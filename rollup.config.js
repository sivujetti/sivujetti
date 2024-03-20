// Usage: npm start -- --configBundle bundle1,bundle2|all
//        npm start -- --configInput backend/plugins/MyPlugin/frontend/rollup.config.js

const path = require('path');
const sucrase = require('@rollup/plugin-sucrase');
const terser = require('@rollup/plugin-terser');

////////////////////////////////////////////////////////////////////////////////
const makeOutputCfg = (...myCfg) => {
    const out = Object.assign({format: 'iife'}, ...myCfg);
    if (!out.banner) out.banner =
`/*!
 * ${out.file.split('/').pop().split('.')[0]} 0.16.0-dev
 * https://github.com/sivujetti/sivujetti
 * @license GPLv3
 */`;
    return out;
};

const makeJsxPlugin = (include = []) =>
    sucrase({
        production: true,
        include, // An empty array means "The directory where {input: 'main-file.js'} is located at"
        transforms: ['jsx'],
        jsxPragma: 'preact.createElement',
        jsxFragmentPragma: 'preact.createFragment',
        disableESTransforms: true,
    });

const watchSettings = {
    clearScreen: false
};

const BundleNames = {
    WEBPAGE_COMMONS: 'webpage-commons',
    WEBPAGE_PREVIEW_RENDERER_APP: 'webpage-renderer-app',
    EDIT_APP_COMMONS: 'edit-app-commons',
    EDIT_APP: 'edit-app',
    AUTH_APPS: 'auth-apps',
    LANG: 'lang',
    TESTS: 'tests',
};

////////////////////////////////////////////////////////////////////////////////
module.exports = args => {
    const isBuild = args.w === undefined;
    const postPlugins = !isBuild ? [] : [terser()];
    const webPagesCommonsPath = '@sivujetti-commons-for-web-pages';
    const webPageExternals = [webPagesCommonsPath];
    const webPagesGlobals = {[webPagesCommonsPath]: 'sivujettiCommonsForWebPages'};
    const previewRendererAppCommonsPath = '@sivujetti-webpage-preview-renderer-app';
    const previewRendererAppGlobals = {[previewRendererAppCommonsPath]: 'sivujettiWebPagePreviewRendererApp'};
    const previewRendererAppExternals = [previewRendererAppCommonsPath];
    const editAppCommonsPath = '@sivujetti-commons-for-edit-app';
    const editAppGlobals = {...webPagesGlobals, [editAppCommonsPath]: 'sivujettiCommonsEditApp'};
    const editAppExternals = [...webPageExternals, editAppCommonsPath];
    const selectedLang = args.configLang || 'fi';
    const targetDirBase = getTargetDirBase(args.configTargetRelDir);

    if (args.configInput) { // custom.js
        let userDefined = require(path.resolve(__dirname, args.configInput));
        if (typeof userDefined === 'function') userDefined = userDefined({selectedLang});
        const cfgs = !Array.isArray(userDefined) ? [userDefined] : userDefined;
        //
        return cfgs.map(cfg => {
            const out = {
                input: cfg.input,
                output: makeOutputCfg({
                    globals: {...previewRendererAppGlobals, ...editAppGlobals},
                    banner: ''
                }, cfg.output),
                plugins: [
                    makeJsxPlugin(cfg.jsxTranspile
                        ? cfg.jsxTranspile.include || []
                        : []),
                ].concat(...postPlugins),
                external: [...previewRendererAppExternals, ...editAppExternals],
                watch: watchSettings,
            };
            ['banner'].forEach(optionalKey => {
                if (cfg[optionalKey]) out[optionalKey] = cfg[optionalKey];
            });
            return out;
        });
    }

    const bundlesStr = args.configBundle || BundleNames.EDIT_APP;
    return createBundablesArray(bundlesStr).map(bundleName => {
        if (bundleName === BundleNames.WEBPAGE_COMMONS)
            return {
                input: 'frontend2/commons-for-web-pages/main.js',
                output: makeOutputCfg({
                    name: webPagesGlobals[webPagesCommonsPath],
                    file: `${targetDirBase}sivujetti-commons-for-web-pages.js`,
                }),
                plugins: postPlugins,
                watch: watchSettings
            };
        if (bundleName === BundleNames.WEBPAGE_PREVIEW_RENDERER_APP)
            return {
                input: 'frontend2/webpage-renderer-app/main.js',
                output: makeOutputCfg({
                    name: 'sivujettiWebPagePreviewRendererApp',
                    file: `${targetDirBase}sivujetti-webpage-renderer-app.js`,
                    globals: {...webPagesGlobals, ...previewRendererAppGlobals},
                }),
                external: [...webPageExternals, ...previewRendererAppExternals],
                plugins: [
                    makeJsxPlugin(),
                ].concat(...postPlugins),
                watch: watchSettings
            };
        if (bundleName === BundleNames.EDIT_APP_COMMONS)
            return {
                input: 'frontend2/commons-for-edit-app/main.js',
                output: makeOutputCfg({
                    name: 'sivujettiCommonsEditApp',
                    file: `${targetDirBase}sivujetti-commons-for-edit-app.js`,
                    globals: webPagesGlobals,
                }),
                external: webPageExternals,
                plugins: [
                    makeJsxPlugin(),
                ].concat(...postPlugins),
                watch: watchSettings
            };
        if (bundleName === BundleNames.EDIT_APP)
            return {
                input: 'frontend2/edit-app/main.js',
                output: makeOutputCfg({
                    name: 'sivujettiEditApp',
                    file: `${targetDirBase}sivujetti-edit-app.js`,
                    globals: editAppGlobals,
                }),
                external: editAppExternals,
                plugins: [
                    makeJsxPlugin(),
                ].concat(...postPlugins),
                watch: watchSettings
            };
        if (bundleName === BundleNames.AUTH_APPS)
            return {
                input: 'frontend2/auth-apps/renderAuthApp.js',
                output: makeOutputCfg({
                    name: 'sivujettiRenderAuthApp',
                    file: `${targetDirBase}sivujetti-render-auth-app.js`,
                    globals: editAppGlobals,
                }),
                external: editAppExternals,
                plugins: [
                    makeJsxPlugin(),
                ].concat(...postPlugins),
                watch: watchSettings
            };
        if (bundleName === BundleNames.LANG) {
            const globals = {'@sivujetti-string-bundles': 'translationStringBundles'};
            const external = ['@sivujetti-string-bundles'];
            return [{
                input: `frontend2/translations/${selectedLang}.js`,
                output: {
                    format: 'iife',
                    file: `${targetDirBase}lang-${selectedLang}.js`,
                    globals,
                },
                external,
                plugins: postPlugins,
                watch: watchSettings
            }, {
                input: `frontend2/translations/auth-apps-${selectedLang}.js`,
                output: {
                    format: 'iife',
                    file: `${targetDirBase}lang-auth-${selectedLang}.js`,
                    globals,
                },
                external,
                plugins: postPlugins,
                watch: watchSettings
            }];
        }
        if (bundleName === BundleNames.TESTS)
            return {
                input: 'frontend/tests/main.js',
                output: makeOutputCfg({
                    file: 'public/tests/bundled-main.js',
                    globals: editAppGlobals,
                }),
                plugins: [makeJsxPlugin()].concat(...postPlugins),
                external: editAppExternals,
                watch: watchSettings
            };
        throw new Error(`Unknown bundle name "${bundleName}". Known: ${Object.values(BundleNames).join(', ')}`);
    }).flat();
};

////////////////////////////////////////////////////////////////////////////////
function getTargetDirBase(input) {
    if (!input) return 'public/sivujetti/';
    if (input.indexOf('./') > -1)
        throw new Error(`Invalid directory ${input}`);
    return input;
}

function createBundablesArray(bundlesStr) {
    const ir = bundlesStr.split(',').map(p => p.trim()).filter(p => !!p);
    return ir.indexOf('all') < 0 ? ir : [...new Set([
        ...ir.filter(b => b !== 'all'),
        ...Object.values(BundleNames),
    ])];
}
