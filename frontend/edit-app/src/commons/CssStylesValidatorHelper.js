import {__, env, urlUtils} from '@sivujetti-commons-for-edit-app';
import {compileSivujettiFlavoredCss} from '../../../webpage/src/EditAppAwareWebPage.js';

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
     * @param {String} previousCommittedValue
     * @returns {Array<Boolean|{stylesStringNotCommitted: String; stylesStringCompiled: String; stylesError: String;}>}
     * @access public
     */
    validateAndCompile(e, previousCommittedValue) {
        const input = e.target.value;
        // Empty input -> commit only if previousCommittedValue is not ''
        if (input.length < 3) {
            return [previousCommittedValue ? true : false, {stylesStringNotCommitted: input, stylesStringCompiled: input, stylesError: ''}];
        }
        const ast = window.stylis.compile(compileSivujettiFlavoredCss('[data-dummy="dummy"]', input));
        // Had non-empty input, but css doesn't contain any rules -> do not commit
        if (ast.reduce((amount, {type}) => amount + (type === 'rule' ? 1 : 0), 0) < 1) {
            return [false, {stylesStringNotCommitted: input, stylesStringCompiled: input, stylesError: __('Styles must contain at least one CSS-rule')}];
        }
        // Had non-empty input, and css does contain rules -> commit changes to the store
        return [true, {stylesStringNotCommitted: input,
                       stylesStringCompiled: this.completeUrls(ast, input),
                       stylesError: ''}];
    }
    /**
     * @param {Array<Object>} ast
     * @param {String} input
     * @returns {String}
     */
    completeUrls(ast, input) {
        // 1. Find css blocks with background, or background-image rules
        const allRulesWithBgs = ast
            .map(it => it.type === 'rule'
                ? it.children.filter(it2 =>
                    it2.type === 'decl' && (it2.props === 'background' || it2.props === 'background-image')
                )
                : null
            )
            .filter(r => r !== null)
            .flat();
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

export default CssStylesValidatorHelper;
