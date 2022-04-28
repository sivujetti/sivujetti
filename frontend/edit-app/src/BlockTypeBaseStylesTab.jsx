import {http, __, api, env, Icon, InputError} from '@sivujetti-commons-for-edit-app';
import {timingUtils} from './commons/utils.js';
import toasters from './commons/Toaster.jsx';
import CssStylesValidatorHelper from './commons/CssStylesValidatorHelper.js';
import {fetchThemeStyles} from './DefaultView/GlobalStylesSection.jsx';
import store, {observeStore, pushItemToOpQueue, selectBlockTypesBaseStyles,
               setBlockTypesBaseStyles} from './store.js';
import {createPopper} from './IndividualBlockStylesTab.jsx';

let isBaseStyleStorePopulated = false;

class BlockTypeBaseStylesTab extends preact.Component {
    // activeThemeId;
    // cssValidator;
    // resourceUrl;
    // stylesTextareaEl;
    // handleCssInputChangedThrottled;
    // unregisterStoreListener;
    // borrowedStyles;
    /**
     * @param {{blockTypeNameTranslated: String; isVisible: Boolean; block: Block;}} props
     */
    constructor(props) {
        super(props);
        this.activeThemeId = api.getActiveTheme().id;
        this.cssValidator = new CssStylesValidatorHelper;
        this.resourceUrl = `/api/themes/${this.activeThemeId}/styles/block-type/${this.props.block.type}`;
        this.stylesTextareaEl = preact.createRef();
        this.handleCssInputChangedThrottled = timingUtils.debounce(
            this.handleCssInputChanged.bind(this),
            env.normalTypingDebounceMillis);
        this.unregisterStoreListener = observeStore(s => selectBlockTypesBaseStyles(s),
            /**
             * @param {Array<RawBlockTypeBaseStyles>} allStyles
             */
            allStyles => {
                if (!this.props.isVisible) return;
                const latest = findBlockTypeStyles(allStyles, this.props.block);
                if (!latest) return;
                if (this.state.stylesString !== latest.styles) {
                    this.setState(createState(latest.styles));
                    this.borrowedStyles = allStyles;
                }
            });
        this.state = createState(null);
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
    componentWillReceiveProps({block, isVisible}) {
        if (!this.props.isVisible && isVisible) {
            fetchThemeStyles().then(({blockTypeStyles}) => {
                if (!isBaseStyleStorePopulated) {
                    store.dispatch(setBlockTypesBaseStyles(blockTypeStyles));
                    isBaseStyleStorePopulated = true;
                }
                this.borrowedStyles = selectBlockTypesBaseStyles(store.getState());
                const bts = findBlockTypeStyles(this.borrowedStyles, block);
                const current = bts ? bts.styles : '';
                if (bts) this.setState(createState(current));
                setTimeout(() => {
                    window.autosize(this.stylesTextareaEl.current);
                }, 1);
            })
            .catch(env.window.console.error);
        }
    }
    /**
     * @access protected
     */
    render({blockTypeNameTranslated, isVisible}, {stylesStringNotCommitted, stylesError}) {
        return <div class={ isVisible ? '' : 'd-none' }>
            <div class="p-absolute" style="right: 0; z-index: 1; margin: .3rem .67rem 0 0;">
                <Icon iconId="info-circle" className="size-xs color-dimmed3"/>
                <span ref={ createPopper.bind(this) } class="my-tooltip dark">
                    <span>{ __('These styles will affect all %s blocks', blockTypeNameTranslated.toLowerCase()) }</span>
                    <span class="popper-arrow" data-popper-arrow></span>
                </span>
            </div>
            <textarea
                value={ stylesStringNotCommitted }
                onInput={ this.handleCssInputChangedThrottled }
                class={ `form-input code${!stylesError ? '' : ' is-error'}` }
                placeholder={ '[[scope]] {\n  color: red;\n}\n[[scope]].specialized {\n  color: blue;\n}' }
                ref={ this.stylesTextareaEl }></textarea>
            <InputError errorMessage={ stylesError }/>
        </div>;
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
        const newSingle = dispatchNewStyles(this.borrowedStyles, result.stylesStringNotCommitted,
                                            block);
        //
        const commit = () => {
            return http.put(this.resourceUrl, newSingle)
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
        const revert = () => {
            dispatchNewStyles(this.borrowedStyles, committed, block, 1);
        };
        //
        store.dispatch(pushItemToOpQueue(`upsert-theme-${this.resourceUrl}-block-type-styles`, {
            doHandle: ($commit, _$revert) => $commit(),
            doUndo(_$commit, $revert) { $revert(); },
            args: [commit, revert],
        }));
    }
}

/**
 * @param {Array<RawBlockTypeBaseStyles>} allStyles
 * @param {String} newVal e.g. '[[scope]] { color: red; }'
 * @param {Block} block
 * @returns {RawBlockTypeBaseStyles}
 */
function dispatchNewStyles(allStyles, newVal, block) {
    const clone = JSON.parse(JSON.stringify(allStyles));
    //
    const currentStyles = findBlockTypeStyles(clone, block);
    if (currentStyles)
        currentStyles.styles = newVal;
    else
        clone.push({blockTypeName: block.type, styles: newVal});
    //
    store.dispatch(setBlockTypesBaseStyles(clone)); // see also observeStore from this.componentWillMount
                                                    // and observeStore @ EditApp.registerWebPageIframeStylesUpdaters
    return currentStyles || clone[clone.length - 1];
}

/**
 * @param {String} stylesString
 * @returns {{stylesString: String; stylesStringNotCommitted: String; stylesError: String;}}
 */
function createState(stylesString) {
    return {stylesString,
            stylesStringNotCommitted: stylesString,
            stylesError: ''};
}

/**
 * @param {Array<RawBlockTypeBaseStyles>} from
 * @param {Block} block
 * @returns {RawBlockTypeBaseStyles|undefined}
 */
function findBlockTypeStyles(from, {type}) {
    return from.find(({blockTypeName}) => blockTypeName === type);
}

export default BlockTypeBaseStylesTab;
