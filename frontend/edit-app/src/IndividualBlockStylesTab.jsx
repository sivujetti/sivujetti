import {http, __, api, env, Icon, InputError} from '@sivujetti-commons-for-edit-app';
import {timingUtils} from './commons/utils.js';
import toasters from './commons/Toaster.jsx';
import CssStylesValidatorHelper from './commons/CssStylesValidatorHelper.js';
import store, {observeStore, selectGlobalBlockTreeBlocksStyles, pushItemToOpQueue,
               setGlobalBlockTreeBlocksStyles, selectPageBlocksStyles, setPageBlocksStyles,
               selectCurrentPage} from './store.js';

class IndividualBlockStylesTab extends preact.Component {
    // isPartOfGlobalBlockTree;
    // stylesTextareaEl;
    // cssValidator;
    // resourceUrl;
    // borrowedStyles;
    // unregisterStoreListener;
    // handleCssInputChangedThrottled;
    /**
     * @param {{isVisible: Boolean; block: Block;}} props
     */
    constructor(props) {
        super(props);
        const {block} = props;
        this.isPartOfGlobalBlockTree = block.isStoredTo === 'globalBlockTree';
        this.stylesTextareaEl = preact.createRef();
        this.cssValidator = new CssStylesValidatorHelper;
        //
        const [selectStateFunc, findBlockStylesFunc] = !this.isPartOfGlobalBlockTree
            ? [selectPageBlocksStyles, findBlockStyles]
            : [selectGlobalBlockTreeBlocksStyles, findStylesForGlobalBlockTreeBlocks];
        const state = store.getState();
        if (!this.isPartOfGlobalBlockTree) {
            const page = selectCurrentPage(state).webPage.data.page;
            this.resourceUrl = `/api/pages/${page.type}/${page.id}/block-styles/${api.getActiveTheme().id}`;
        } else {
            this.resourceUrl = `/api/global-block-trees/${block.globalBlockTreeId}/block-styles/${api.getActiveTheme().id}`;
        }
        this.borrowedStyles = selectStateFunc(state);
        this.unregisterStoreListener = observeStore(s => selectStateFunc(s),
            /**
             * @param {Array<RawBlockStyle>|Array<RawGlobalBlockTreeBlocksStyles>} allStyles
             */
            allStyles => {
                const latest = findBlockStylesFunc(allStyles, block);
                if (!latest)
                    return;
                if (this.state.stylesString !== latest.styles) {
                    this.setState({stylesString: latest.styles,
                                   stylesStringNotCommitted: latest.styles,
                                   stylesError: ''});
                    this.borrowedStyles = allStyles;
                }
            });
        const styles = this.borrowedStyles.length ? findBlockStylesFunc(this.borrowedStyles, block) : null;
        const stylesString = styles ? styles.styles : '';
        this.state = {stylesString,
                      stylesStringNotCommitted: stylesString,
                      stylesError: ''};
        this.handleCssInputChangedThrottled = timingUtils.debounce(
            this.handleCssInputChanged.bind(this),
            env.normalTypingDebounceMillis);
    }
    /**
     * @access protected
     */
    componentWillReceiveProps({isVisible}) {
        if (!this.props.isVisible && isVisible) {
            setTimeout(() => {
                window.autosize(this.stylesTextareaEl.current);
            }, 1);
        }
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregisterStoreListener();
    }
    /**
     * @access protected
     */
    render({isVisible}, {stylesStringNotCommitted, stylesError}) {
        return <div class={ isVisible ? '' : 'd-none' }>{ this.resourceUrl.indexOf('/-') < 0 ?
            [
                <div class="p-absolute" style="right: 0; z-index: 1; margin: .3rem .67rem 0 0;">
                    <Icon iconId="info-circle" className="size-xs color-dimmed3"/>
                    <span ref={ createPopper.bind(this) } class="my-tooltip dark">
                        <span>{ __('These styles will affect this individual block only') }</span>
                        <span class="popper-arrow" data-popper-arrow></span>
                    </span>
                </div>,
                <textarea
                    value={ stylesStringNotCommitted }
                    onInput={ this.handleCssInputChangedThrottled }
                    class={ `form-input code${!stylesError ? '' : ' is-error'}` }
                    placeholder={ '[[scope]] {\n  color: red;\n}\n[[scope]].specialized {\n  color: blue;\n}' }
                    ref={ this.stylesTextareaEl }></textarea>,
                <InputError errorMessage={ stylesError }/>,
            ]
            : <div style="color: var(--color-fg-dimmed)">Tyylejä voi muokata sivun luomisen jälkeen.</div>
        }</div>;
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleCssInputChanged(e) {
        const committed = this.state.stylesString;
        const [shouldCommit, result] = this.cssValidator.validate(e, committed);
        if (!shouldCommit) {
            this.setState(result);
            return;
        }
        const {block} = this.props;
        const newAll = dispatchNewBlockStyles(this.borrowedStyles, result.stylesStringNotCommitted,
                                              block, this.isPartOfGlobalBlockTree);
        //
        const commit = this.createCommitFn(newAll, block);
        const revert = () => {
            dispatchNewBlockStyles(this.borrowedStyles, committed, block, this.isPartOfGlobalBlockTree);
        };
        //
        store.dispatch(pushItemToOpQueue(`upsert-theme-${this.resourceUrl}-block-styles`, {
            doHandle: ($commit, _$revert) => $commit(),
            doUndo(_$commit, $revert) { $revert(); },
            args: [commit, revert],
        }));
    }
    /**
     * @param {Array<RawBlockStyle>|Array<RawGlobalBlockTreeBlocksStyles>} newStyles
     * @param {Block} block
     * @returns {() => Promise<Boolean>}
     * @access private
     */
    createCommitFn(newStylesAll, block) {
        return () => {
            const newStyles = !this.isPartOfGlobalBlockTree
                ? newStylesAll
                : newStylesAll.find(bag => bag.globalBlockTreeId === block.globalBlockTreeId).styles;
            return http.put(this.resourceUrl, {styles: newStyles})
                .then(resp => {
                    if (resp.ok !== 'ok') throw new Error('-');
                    return true;
                })
                .catch(err => {
                    env.window.console.error(err);
                    toasters.editAppMain(__('Something unexpected happened.'), 'error');
                    return false;
                });
        };
    }
}

/**
 * @param {Array<RawBlockStyle>|Array<RawGlobalBlockTreeBlocksStyles>} allStyles
 * @param {String} newVal e.g. '[[scope]] { color: red; }'
 * @param {Block} block
 * @param {Boolean} isPartOfGlobalBlockTree
 * @returns {Array<RawBlockStyle>|Array<RawGlobalBlockTreeBlocksStyles>}
 */
function dispatchNewBlockStyles(allStyles, newVal, block, isPartOfGlobalBlockTree) {
    const clone = JSON.parse(JSON.stringify(allStyles));

    // 1. Find containing array
    const stylesRef = (function () {
        // Page block, style are always in the same array
        if (!isPartOfGlobalBlockTree) return clone;
        // Global tree block, find or create the array
        const {globalBlockTreeId} = block;
        let bag = clone.find(bag => bag.globalBlockTreeId === globalBlockTreeId);
        if (!bag) {
            const newBag = {globalBlockTreeId: block.globalBlockTreeId, styles: []};
            const newLen = clone.push(newBag);
            bag = clone[newLen - 1];
        }
        return bag.styles;
    })();

    // 2. Mutate the array or styles object in it
    // currentStyle references to pageBlockStyles[blockPos] (if isPartOfGlobalBlockTree = true)
    //                            globalBlockTreeBlocksStyles[globalTreeIdPos].styles[blockPos] (if isPartOfGlobalBlockTree = false)
    const currentStyles = findBlockStyles(stylesRef, block);
    if (currentStyles) {
        currentStyles.styles = newVal;
    } else {
        stylesRef.push({blockId: block.id, styles: newVal});
    }

    // 3. Commit
    const updateStateFunc = !isPartOfGlobalBlockTree
        ? setPageBlocksStyles
        : setGlobalBlockTreeBlocksStyles;
    store.dispatch(updateStateFunc(clone)); // see also observeStore from this.componentWillMount
                                            // and observeStore @ EditApp.registerWebPageIframeStylesUpdaters
    return clone;
}

/**
 * @param {Array<RawBlockStyle>} from
 * @param {Block} block
 * @returns {RawBlockStyle|undefined}
 */
function findBlockStyles(from, {id}) {
    return from.find(s => s.blockId === id);
}

/**
 * @param {Array<RawGlobalBlockTreeBlocksStyles>} from
 * @param {Block} block
 * @returns {RawBlockStyle|undefined}
 */
function findStylesForGlobalBlockTreeBlocks(from, block) {
    const {globalBlockTreeId} = block;
    const bag = from.find(bag => bag.globalBlockTreeId === globalBlockTreeId);
    if (!bag) return undefined;
    return findBlockStyles(bag.styles, block);
}

/**
 * @param {HTMLElement} el
 * @param {Number} overflowPadding = 8
*/
function createPopper(el, overflowPadding = 8) {
    if (!el || this.popperInstance) return;
    //
    const ref = el.previousElementSibling;
    const content = el;
    this.popperInstance = window.Popper.createPopper(ref, content, {
        placement: 'top',
        modifiers: [{
            name: 'offset',
            options: {offset: [0, 8]},
        }, {
            name: 'preventOverflow',
            options: {altAxis: true, padding: overflowPadding},
        }],
    });
    ref.addEventListener('mouseenter', () => showPopper(content, this));
    ref.addEventListener('mouseleave', () => hidePopper(content));
}

function showPopper(content, cmp) {
    content.classList.add('visible');
    cmp.popperInstance.update();
}

function hidePopper(content) {
    content.classList.remove('visible');
}

export default IndividualBlockStylesTab;
export {createPopper};
