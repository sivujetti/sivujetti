import {api, signals, http, __, env, Icon, MenuSection, LoadingSpinner} from '@sivujetti-commons-for-edit-app';
import toasters from '../commons/Toaster.jsx';
import Tabs from '../commons/Tabs.jsx';
import store, {pushItemToOpQueue} from '../store.js';
import {observeStore as observeStore2} from '../store2.js';
import {StyleTextarea, tempHack} from '../Block/BlockStylesTab.jsx';
import {wc_hex_is_light} from '../Block/VisualStyles.jsx';

class GlobalStylesSection extends MenuSection {
    // activeThemeId;
    // userCanEditCss;
    // unregistrables;
    // globalStyles;
    // pickers;
    // varNameOfCurrentlyOpenPicker;
    // helperPicker;
    /**
     * @access protected
     */
    componentDidMount() {
        this.setState({numStyles: undefined, currentTabIdx: 0});
        this.activeThemeId = api.getActiveTheme().id;
        this.userCanEditCss = api.user.can('editThemeCss');
        this.unregistrables = [signals.on('on-web-page-click-received', () => {
            if (!this.varNameOfCurrentlyOpenPicker) return;
            this.pickers.get(this.varNameOfCurrentlyOpenPicker).hide();
        }), observeStore2('themeStyles', ({themeStyles}) => {
            if (!this.state.bodyStyleMainUnit) return;
            const latestUnit = themeStyles.find(s => s.blockTypeName === '_body_').units[0];
            if (this.state.bodyStyleMainUnit !== latestUnit)
                this.setState({bodyStyleMainUnit: latestUnit});
        })];
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregistrables.forEach(unreg => unreg());
    }
    /**
     * @param {any} state
     * @param {{sections: Array<String>; startAddPageMode: () => void; startAddPageTypeMode: () => void; blockTreesRef: preact.Ref; currentWebPage: EditAppAwareWebPage;}} props
     * @access protected
     */
    render(_, {numStyles, bodyStyleMainUnit, isCollapsed, currentTabIdx}) {
        let firstTabContent;
        if (numStyles === undefined)
            firstTabContent = null;
        else if (numStyles === null)
            firstTabContent = <LoadingSpinner/>;
        else firstTabContent = <div class={ `global-styles has-color-pickers${this.userCanEditCss ? '' : ' mt-2 pt-2'}` }>
            { this.globalStyles.map(({name, friendlyName}) =>
            <div class={ `d-flex${wc_hex_is_light(this.state[name]) ? ' is-very-light-color' : ''}` }>
                <div ref={ el => this.createColorPickerFor(name, el) }></div>
                <label>
                    <span>{ __(friendlyName) }</span>
                    <input
                        onInput={ e => this.handleColorInputValChanged(name, e.target.value) }
                        value={ this.state[name] }
                        class={ `form-input tight${this.state[`${name}IsValid`] ? '' : ' is-error'}` }/>
                </label>
            </div>) }
            <div class="hidden-helper-picker" ref={ el => {
                if (el && !this.helperPicker) this.helperPicker = window.Pickr.create({
                    el,
                    components: {preview: false, opacity: false, hue: false, interaction: {}}
                });
            } }></div>
        </div>;
        return <section class={ `panel-section${isCollapsed ? '' : ' open'}` }>
            <button class="flex-centered pr-2 section-title col-12" onClick={ this.toggleIsCollapsed.bind(this) }>
                <Icon iconId="palette" className="p-absolute size-sm mr-2 color-pink"/>
                <span class="pl-1 d-block col-12 color-default">
                    { __('Styles') }
                    <span class="text-ellipsis text-tiny col-12">{ __('Colours and fonts') }</span>
                </span>
                <Icon iconId="chevron-right" className="p-absolute size-xs"/>
            </button>
            <div>
                { this.userCanEditCss ? <Tabs
                    links={ [__('Colours'), __('Root styles')] }
                    onTabChanged={ toIdx => this.setState({currentTabIdx: toIdx}) }
                    className="text-tinyish mt-0 mb-2"/> : null }
                <div class={ currentTabIdx === 0 ? '' : 'd-none' }>
                    { firstTabContent }
                </div>
                <div class={ currentTabIdx === 0 ? 'd-none' : '' }>
                    { this.userCanEditCss ? <StyleTextarea
                        unitCopy={ Object.assign({}, bodyStyleMainUnit) }
                        unitCls="j-_body_"
                        blockTypeName="_body_"
                        isVisible={ true }/> : null }
                </div>
            </div>
        </section>;
    }
    /**
     * @access private
     */
    toggleIsCollapsed() {
        const newState = {isCollapsed: !this.state.isCollapsed};
        if (newState.isCollapsed === false && this.state.numStyles === undefined) {
            newState.numStyles === null;
            tempHack(({globalStyles, styles}) => {
                this.globalStyles = globalStyles;
                this.pickers = new Map;
                // {style1: color, style1IsValid: true, style2: color, style2IsValid: true ...}
                const colourStylesState = createState(this.globalStyles);
                this.setState(Object.assign({bodyStyleMainUnit: styles.find(s => s.blockTypeName === '_body_').units[0]}, colourStylesState));
            });
        }
        this.setState(newState);
    }
    /**
     * @param {String} varName
     * @param {String} newValue
     * @access private
     */
    handleColorInputValChanged(varName, newValue) {
        const wasSuccefullyParsed = this.helperPicker.setColor(newValue);
        const newState = {[varName]: newValue,
                          [`${varName}IsValid`]: false};
        if (!wasSuccefullyParsed) {
            this.setState(newState);
            return;
        }
        const canonicalized = this.helperPicker.getColor().toHEXA();
        if (canonicalized.toString() === '#000000' && /^[a-zA-Z]+$/.test(newValue)) {
            this.setState(newState);
            return;
        }
        this.applyGlobalVarToState(varName, canonicalized.slice(0, 4));
        this.applyNewColorAndEmitChangeOp(varName, this.helperPicker.getColor(), this.pickers.get(varName));
    }
    /**
     * @param {String} id Global var name or block type name
     * @param {String|PickrColor} newStyles
     * @access private
     */
    applyNewColorAndEmitChangeOp(id, newStyles) {
        const findStyle = (from, id, key) => from.findIndex(s => s[key] === id, key);
        let revert, url, data;
        // mutate this.allStyles
        arguments[2].setHSVA(newStyles.h, newStyles.s, newStyles.v, newStyles.a);
        //
        const idx = findStyle(this.globalStyles, id, 'name');
        const before = this.globalStyles[idx].value.value;
        const hexOrHexa = newStyles.toHEXA().slice(0, 4);
        this.globalStyles[idx].value.value = hexOrHexa.length === 4 ? hexOrHexa : hexOrHexa.concat('ff');
        //
        url = `/api/themes/${this.activeThemeId}/styles/global`;
        data = {allStyles: this.globalStyles};
        //
        revert = () => {
            const idx = findStyle(this.globalStyles, id, 'name');
            this.globalStyles[idx].value.value = before;
            const asString = this.applyGlobalVarToState(id, before);
            this.pickers.get(id).setColor(asString);
        };
        const commit = () => http.put(url, data)
            .then(resp => {
                if (resp.ok !== 'ok') throw new Error('-');
                return true;
            })
            .catch(err => {
                env.window.console.error(err);
                toasters.editAppMain(__('Something unexpected happened.'), 'error');
                return false;
            });
        //
        store.dispatch(pushItemToOpQueue('update-theme-global-styles', {
            doHandle: ($commit, _$revert) => $commit(),
            doUndo(_$commit, $revert) { $revert(); },
            args: [commit.bind(this), revert.bind(this)],
        }));
    }
    /**
     * @param {String} varName
     * @param {HTMLLabelElement} from
     * @access private
     */
    createColorPickerFor(varName, from) {
        if (!from || this.pickers.has(varName))
            return;
        //
        const pickr = window.Pickr.create({
            el: from,
            theme: 'nano',
            default: this.state[varName],
            components: {preview: true, opacity: true, hue: true, interaction: {}}
        });
        pickr.on('show', (_color, _instance) => {
            this.varNameOfCurrentlyOpenPicker = varName;
        }).on('hide', _instance => {
            this.varNameOfCurrentlyOpenPicker = null;
        }).on('change', (color, _source, _instance) => {
            this.applyGlobalVarToState(varName, color.toHEXA().slice(0, 4));
        }).on('changestop', (_source, instance) => {
            this.applyNewColorAndEmitChangeOp(varName, instance.getColor(), instance);
        });
        //
        this.pickers.set(varName, pickr);
    }
    /**
     * @param {String} varName
     * @param {[String, String, String, String]} hexa ['ff','00','00','ff']
     * @returns {String} '#ff0000ff'
     * @access private
     */
    applyGlobalVarToState(varName, hexa) {
        const asString = `#${hexa.join('')}`;
        this.setState({[varName]: asString, [`${varName}IsValid`]: true});
        this.props.currentWebPage.setCssVarValue(varName, {type: 'color', value: hexa});
        return asString;
    }
}

/**
 * @param {Array<RawCssRule>} globalStyles
 * @returns {{[key: String]: String;}}
 */
function createState(globalStyles) {
    const a = globalStyles.filter(({value}) => value.type === 'color').reduce((obj, {name, value}) =>
        Object.assign(obj, {[name]: `#${value.value.join('')}`, [`${name}IsValid`]: true})
    , {numStyles: Infinity});
    //
    return a;
}

/**
 * @typedef {([String, String, String, String, () => String])} PickrColor
 */

export default GlobalStylesSection;
