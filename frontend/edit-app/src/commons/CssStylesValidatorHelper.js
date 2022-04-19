import {__} from '@sivujetti-commons-for-edit-app';
import {compileSivujettiFlavoredCss} from '../../../webpage/src/EditAppAwareWebPage.js';

class CssStylesValidatorHelper {
    /**
     * @param {Event} e
     * @param {String} previousCommittedValue
     * @returns {Array<Boolean|{stylesStringNotCommitted: String; stylesError: String;}>}
     * @access public
     */
    validate(e, previousCommittedValue) {
        const input = e.target.value;
        // Empty input -> commit only if previousCommittedValue is not ''
        if (input.length < 3) {
            return [previousCommittedValue ? true : false, {stylesStringNotCommitted: input, stylesError: ''}];
        }
        const ast = window.csstree.parse(compileSivujettiFlavoredCss('[data-dummy="dummy"]', input));
        const nodesThatCount = window.csstree.findAll(ast, (node, _item, _list) =>
            node.type === 'Selector'
        );
        // Had non-empty input, but css doesn't contain any rules -> do not commit
        if (!nodesThatCount.length) {
            return [false, {stylesStringNotCommitted: input, stylesError: __('Styles must contain at least one CSS-rule')}];
        }
        // Had non-empty input, and css does contain rules -> commit changes to the store
        return [true, {stylesStringNotCommitted: input, stylesError: ''}];
    }
}

export default CssStylesValidatorHelper;
