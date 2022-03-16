import {api, http, __, env, Icon} from '@sivujetti-commons-for-edit-app';
import Tabs from '../commons/Tabs.jsx';
import LoadingSpinner from '../commons/LoadingSpinner.jsx';
import toasters from '../commons/Toaster.jsx';
import store, {pushItemToOpQueue} from '../store.js';
import {Section} from './OnThisPageSection.jsx';

class GlobalStylesSection extends Section {
    // activeThemeId;
    // styles;
    // pickers;
    // helperPicker;
    /**
     * @access protected
     */
    componentDidMount() {
        this.setState({numStyles: null, currentTabIdx: 0});
        this.activeThemeId = api.getActiveTheme().id;
        http.get(`/api/themes/${this.activeThemeId}/styles`)
            .then(styles => {
                this.styles = styles;
                this.pickers = new Map;
                // {style1: color, style1IsValid: true, style2: color, style2IsValid: true ...} &&
                // {blockType_Section: String, blockType_Another: String ...}
                this.setState(createState(this.styles));
            })
            .catch(env.window.console.error);
    }
    /**
     * @param {{sections: Array<String>; startAddPageMode: () => void; startAddPageTypeMode: () => void; blockTreesRef: preact.Ref; currentWebPage: EditAppAwareWebPage;}} props
     * @access protected
     */
    render(_, {numStyles, isCollapsed, currentTabIdx}) {
        let content;
        if (numStyles === undefined)
            content = null;
        else if (numStyles === null)
            content = <LoadingSpinner/>;
        else content = <>
        <div class={ `global-styles mt-2 pt-2${currentTabIdx === 0 ? '' : ' d-none'}` }>
            { this.styles.globalStyles.map(({name, friendlyName}) =>
            <div class="d-flex">
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
        </div>
        <div class={ `mt-2 pt-2${currentTabIdx === 0 ? ' d-none' : ''}` }>
            { this.styles.blockTypeStyles.map((bs, i) => <div class="accordion">
                <input id={ `accordion-${i}` } type="radio" name="accordion-radio" defaultChecked={ i === 0 } hidden/>
                <label class="accordion-header c-hand pl-0" htmlFor={ `accordion-${i}` }>
                    <i class="icon icon-arrow-right mr-1"></i>
                    <i class="icon d-inline-block mr-1">
                        <Icon iconId="chevron-right" className="size-xs"/>
                    </i>
                    { __(api.blockTypes.get(bs.blockTypeName).friendlyName) }
                </label>
                <div class="accordion-body">
                    <textarea
                        value={ this.state[`blockType_${bs.blockTypeName}`] }
                        onChange={ e => this.handleBlockTypeCssChanged(bs.blockTypeName, e.target.value) }
                        class="form-input"
                        rows="4"></textarea>
                </div>
            </div>) }
        </div>
        </>;
        return <section class={ `panel-section${isCollapsed ? '' : ' open'}` }>
            <button class="d-flex col-12 flex-centered pr-2" onClick={ () => { this.setState({isCollapsed: !isCollapsed}); } }>
                <Icon iconId="palette" className="size-sm mr-2 color-pink"/>
                <span class="pl-1 color-default">{ __('Styles') }</span>
                <Icon iconId="chevron-right" className="col-ml-auto size-xs"/>
            </button>
            <div>
            <Tabs
                links={ [__('Globals'), __('Block types')] }
                onTabChanged={ toIdx => this.setState({currentTabIdx: toIdx}) }
                className="text-tinyish mt-0 mb-2"/>
            { content }
            </div>
        </section>;
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
        this.applyNewColorAndEmitChangeOp('global', varName, this.helperPicker.getColor(), this.pickers.get(varName));
    }
    /**
     * @param {String} blockTypeName
     * @param {String} newStyles
     * @access private
     */
    handleBlockTypeCssChanged(blockTypeName, newStyles) {
        newStyles = newStyles.trim();
        this.applyBlockStylesToState(blockTypeName, newStyles);
        this.applyNewColorAndEmitChangeOp('blockType', blockTypeName, newStyles);
    }
    /**
     * @param {'global'|'blockType'} type
     * @param {String} id Global var name or block type name
     * @param {String|PickrColor} newStyles
     * @access private
     */
    applyNewColorAndEmitChangeOp(type, id, newStyles) {
        const findStyle = (from, id, key) => from.findIndex(s => s[key] === id, key);
        let reverse, url, data;
        // mutate this.allStyles or this.styles.blockTypeStyles
        if (type === 'global') {
            arguments[3].setHSVA(newStyles.h, newStyles.s, newStyles.v, newStyles.a);
            //
            const idx = findStyle(this.styles.globalStyles, id, 'name');
            const before = this.styles.globalStyles[idx].value.value;
            const hexOrHexa = newStyles.toHEXA().slice(0, 4);
            this.styles.globalStyles[idx].value.value = hexOrHexa.length === 4 ? hexOrHexa : hexOrHexa.concat('ff');
            //
            url = `/api/themes/${this.activeThemeId}/styles/global`;
            data = {allStyles: this.styles.globalStyles};
            //
            reverse = () => {
                const idx = findStyle(this.styles.globalStyles, id, 'name');
                this.styles.globalStyles[idx].value.value = before;
                const asString = this.applyGlobalVarToState(id, before);
                this.pickers.get(id).setColor(asString);
            };
        } else if (type === 'blockType') {
            const idx = findStyle(this.styles.blockTypeStyles, id, 'blockTypeName');
            const before = this.styles.blockTypeStyles[idx].styles;
            this.styles.blockTypeStyles[idx].styles = newStyles;
            //
            url = `/api/themes/${this.activeThemeId}/styles/block-type/${id}`;
            data = {styles: newStyles};
            //
            reverse = () => {
                const idx = findStyle(this.styles.blockTypeStyles, id, 'blockTypeName');
                this.styles.blockTypeStyles[idx].styles = before;
                this.applyBlockStylesToState(id, before);
            };
        } else {
            throw new Error();
        }
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
        store.dispatch(pushItemToOpQueue(`update-theme-${type}-styles`, {
            doHandle: ($commit, _$reverse) =>
                $commit()
            ,
            doUndo(_$commit, $reverse) {
                $reverse();
            },
            args: [commit.bind(this), reverse.bind(this)],
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
        pickr.on('change', (color, _source, _instance) => {
            this.applyGlobalVarToState(varName, color.toHEXA().slice(0, 4));
        }).on('changestop', (_source, instance) => {
            this.applyNewColorAndEmitChangeOp('global', varName, instance.getColor(), instance);
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
    applyBlockStylesToState(blockTypeName, newStyles) {
        this.setState({[`blockType_${blockTypeName}`]: newStyles});
        this.props.currentWebPage.updateCssStyles({type: 'blockType', id: blockTypeName}, newStyles);
    }
}

/**
 * @param {{globalStyles: Array<RawCssRule>; blockTypeStyles: Array<{blockTypeName: String; styles: String;}>;}} styles
 * @returns {{[key: String]: String;}}
 */
function createState({globalStyles, blockTypeStyles}) {
    const a = globalStyles.filter(({value}) => value.type === 'color').reduce((obj, {name, value}) =>
        Object.assign(obj, {[name]: `#${value.value.join('')}`, [`${name}IsValid`]: true})
    , {numStyles: Infinity});
    //
    blockTypeStyles.forEach(({blockTypeName, styles}) => {
        a[`blockType_${blockTypeName}`] = styles;
    });
    //
    return a;
}

/**
 * @typedef {([String, String, String, String, () => String])} PickrColor
 */

export default GlobalStylesSection;
