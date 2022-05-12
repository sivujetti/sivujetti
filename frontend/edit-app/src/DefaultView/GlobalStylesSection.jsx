import {api, signals, http, __, env, Icon, MenuSection, LoadingSpinner} from '@sivujetti-commons-for-edit-app';
import toasters from '../commons/Toaster.jsx';
import store, {pushItemToOpQueue} from '../store.js';

class GlobalStylesSection extends MenuSection {
    // activeThemeId;
    // unregisterSignalListener;
    // globalStyles;
    // pickers;
    // varNameOfCurrentlyOpenPicker;
    // helperPicker;
    /**
     * @access protected
     */
    componentDidMount() {
        this.setState({numStyles: undefined});
        this.activeThemeId = api.getActiveTheme().id;
        this.unregisterSignalListener = signals.on('on-web-page-click-received', () => {
            if (!this.varNameOfCurrentlyOpenPicker) return;
            this.pickers.get(this.varNameOfCurrentlyOpenPicker).hide();
        });
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregisterSignalListener();
    }
    /**
     * @param {any} state
     * @param {{sections: Array<String>; startAddPageMode: () => void; startAddPageTypeMode: () => void; blockTreesRef: preact.Ref; currentWebPage: EditAppAwareWebPage;}} props
     * @access protected
     */
    render(_, {numStyles, isCollapsed}) {
        let content;
        if (numStyles === undefined)
            content = null;
        else if (numStyles === null)
            content = <LoadingSpinner/>;
        else content = <div class="global-styles mt-2 pt-2">
            { this.globalStyles.map(({name, friendlyName}) =>
            <div class={ `d-flex${wc_hex_is_light(this.state[name], 220) ? ' is-very-light-color' : '' }` }>
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
            <button class="d-flex col-12 flex-centered pr-2" onClick={ this.toggleIsCollapsed.bind(this) }>
                <Icon iconId="palette" className="size-sm mr-2 color-pink"/>
                <span class="pl-1 color-default">{ __('Styles') }</span>
                <Icon iconId="chevron-right" className="col-ml-auto size-xs"/>
            </button>
            <div>{ content }</div>
        </section>;
    }
    /**
     * @access private
     */
    toggleIsCollapsed() {
        const newState = {isCollapsed: !this.state.isCollapsed};
        if (newState.isCollapsed === false && this.state.numStyles === undefined) {
            newState.numStyles === null;
            fetchThemeStyles().then(({globalStyles}) => {
                this.globalStyles = globalStyles;
                this.pickers = new Map;
                // {style1: color, style1IsValid: true, style2: color, style2IsValid: true ...}
                this.setState(createState(this.globalStyles));
            })
            .catch(env.window.console.error);
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
    /**
     * @param {String} blockTypeName
     * @param {String} newStyles
     * @access private
     */
    _applyBlockStylesToState(blockTypeName, newStyles) {
        this.props.currentWebPage.updateCssStyles({type: 'blockType', id: blockTypeName}, newStyles);
    }
}

let stylesCached = null;

/**
 * @returns {Promise<{globalStyles: Array<RawCssRule>; blockTypeStyles: Array<RawBlockTypeBaseStyles>;}>}
 */
function fetchThemeStyles() {
    if (stylesCached)
        return Promise.resolve(stylesCached);
    return http.get(`/api/themes/${api.getActiveTheme().id}/styles`)
        .then(styles => {
            stylesCached = styles;
            return stylesCached;
        });
}

/**
 * https://stackoverflow.com/a/51567564
 *
 * @param {String} hexa
 * @param {Number} howLight = 155
 * @param {Boolean} multiplyByAlpha = false
 * @param {Boolean}
 */
function wc_hex_is_light(hexa, howLight = 155, multiplyByAlpha = false) {
    const c_r = parseInt(hexa.substring(1, 3), 16);
    const c_g = parseInt(hexa.substring(3, 5), 16);
    const c_b = parseInt(hexa.substring(5, 7), 16);
    const a = !multiplyByAlpha ? 1 : (parseInt(hexa.substring(7, 9), 16) / 255);
    const brightness = (((c_r * 299) + (c_g * 587) + (c_b * 114)) * a) / 1000;
    return brightness > howLight;
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
export {fetchThemeStyles};
