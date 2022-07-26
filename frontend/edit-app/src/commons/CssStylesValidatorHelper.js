import {__, env, urlUtils} from '@sivujetti-commons-for-edit-app';

/** @type {HTMLStyleElement} */
let helperStyleTag;

class CssStylesValidatorHelper {
    /**
     */
    constructor() {
        if (!helperStyleTag) {
            const t = env.document.createElement('style');
            t.setAttribute('data-injected-by', 'sivujetti-styles-validator-helper');
            env.document.head.appendChild(t);
            helperStyleTag = env.document.head.querySelector('style[data-injected-by="sivujetti-styles-validator-helper"]');
        }
    }
    /**
     * @param {Event} e
     * @param {(input: String) => String} completeInput
     * @param {String} previousCommittedValue
     * @returns {Array<Boolean|{generatedCss: String|null; error: String;}>}
     * @access public
     */
    validateAndCompileScss(e, completeInput, previousCommittedValue) {
        const input = e.target.value;
        // Empty input -> commit only if previousCommittedValue is not ''
        if (input.length < 3) {
            return [previousCommittedValue ? true : false, {generatedCss: null, error: ''}];
        }
        const ast = window.stylis.compile(completeInput(input));
        let numDecls = 0;
        traverse(ast, node => { if (node.type === 'decl') numDecls += 1; });
        // Had non-empty input, but css doesn't contain any rules -> do not commit
        if (numDecls < 1) {
            return [false, {generatedCss: null, error: __('Styles must contain at least one CSS-rule')}];
        }
        // Had non-empty input, and css does contain rules -> commit changes to the store
        return [true, {generatedCss: this.completeUrls(ast, window.stylis.serialize(ast, window.stylis.stringify)),
                       error: ''}];
    }
    /**
     * @param {Array<Object>} ast
     * @param {String} input
     * @returns {String}
     */
    completeUrls(ast, input) {
        // 1. Find css blocks with background, or background-image rules
        const allRulesWithBgs = [];
        traverse(ast, node => {
            if (node.type === 'decl' && (node.props === 'background' || node.props === 'background-image'))
                allRulesWithBgs.push(node);
        });
        if (!allRulesWithBgs)
            return input;

        // 2. Parse them using a native style-tag
        helperStyleTag.innerHTML = allRulesWithBgs.map(({value}, i) =>
            // value = background:url(url); or background-image:url(url);
            `[data-tmp="${i}"]{${value}}\n`
        ).join('');
        const rules = helperStyleTag.sheet.cssRules;
        if (!rules.length) return input;

        // 3. Replace & prefixify all url()'s that don't start with urlUtils.assetBaseUrl
        // with the normalized url
        const replaced = new Map;
        Array.from(rules).forEach(rule => {
            if (!rule.style || !rule.style.backgroundImage || replaced.has(rule.style.backgroundImage))
                return;
            replaced.set(rule.style.backgroundImage, 1);
            if (rule.style.backgroundImage.indexOf('url("') < 0)
                return;
            // 'url("foobar")' -> 'foobar';
            const urlNormalized = rule.style.backgroundImage.slice('url("'.length, -('")'.length));
            //
            if (urlNormalized.startsWith('http://') || urlNormalized.startsWith('https://') || urlNormalized.startsWith('//'))
                return;
            //
            if (!urlNormalized.startsWith(urlUtils.assetBaseUrl))
                input = input.replace(urlNormalized, urlUtils.makeAssetUrl(urlNormalized));
        });
        return input;
    }
}

/**
 * @param {Array<{children: String|Array<Object>} & {[key: String]: any;}>} arr
 * @param {(Object) => void} fn
 */
function traverse(arr, fn) {
    for (const item of arr) {
        fn(item);
        if (typeof item.children !== 'string' && item.children.length)
            traverse(item.children, fn);
    }
}

export default CssStylesValidatorHelper;
