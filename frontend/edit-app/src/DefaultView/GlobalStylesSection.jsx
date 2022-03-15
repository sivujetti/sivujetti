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
        this.applyGlobalVarToState(varName, canonicalized);
        this.applyNewColorAndEmitChangeOp(this.pickers.get(varName), varName, this.helperPicker.getColor());
    }
    /**
     * @param {String} blockTypeName
     * @param {String} newStyles
     * @access private
     */
    handleBlockTypeCssChanged(blockTypeName, newStyles) {
        this.applyBlockStylesToState(blockTypeName, newStyles);
        this.applyNewColorAndEmitChangeOp2(blockTypeName, newStyles);
    }
    /**
     * @param {Object} instance
     * @param {String} varName
     * @param {PickrColor|null} color = instance.getColor()
     * @access private
     */
    applyNewColorAndEmitChangeOp(instance, varName, color = instance.getColor()) {
        instance.setHSVA(color.h, color.s, color.v, color.a);
        // mutate this.allStyles
        const before = JSON.parse(JSON.stringify(this.styles.globalStyles));
        const idx = this.styles.globalStyles.findIndex(s => s.name === varName);
        const hexOrHexa = instance.getColor().toHEXA().slice(0, 4);
        this.styles.globalStyles[idx].value.value = hexOrHexa.length === 4 ? hexOrHexa : hexOrHexa.concat('ff');
        const after = JSON.parse(JSON.stringify(this.styles.globalStyles));
        //
        store.dispatch(pushItemToOpQueue('update-theme-global-styles', {
            doHandle: (_$newStyles, _$stylesBefore, $this) => {
                return http.put(`/api/themes/${$this.activeThemeId}/global-styles`, {allStyles: $this.styles.globalStyles})
                    .then(resp => {
                        if (resp.ok !== 'ok') throw new Error('-');
                        return true;
                    })
                    .catch(err => {
                        env.window.console.error(err);
                        toasters.editAppMain(__('Something unexpected happened.'), 'error');
                        return false;
                    });
            },
            doUndo(_$newStyles, $stylesBefore, $this) {
                $this.styles.globalStyles = $stylesBefore; // Mutate
                const newState = createState($this.styles.globalStyles);
                $this.setState(newState);
                $this.styles.globalStyles.forEach(({name}) => {
                    $this.pickers.get(name).setColor(newState[name]);
                });
            },
            args: [after, before, this],
        }));
    }
    /**
     * @param {String} blockTypeName
     * @param {String} newStyles
     * @access private
     */
    applyNewColorAndEmitChangeOp2(blockTypeName, newStyles) {
        const findStyle = (all, name) => all.findIndex(s => s.blockTypeName === name);
        // mutate this.styles.blockTypeStyles
        const idx = findStyle(this.styles.blockTypeStyles, blockTypeName);
        const before = this.styles.blockTypeStyles[idx].styles;
        this.styles.blockTypeStyles[idx].styles = newStyles;
        //
        const commit = () =>  {
            // todo
        };
        const reverse = () => {
            const idx = findStyle(this.styles.blockTypeStyles, blockTypeName);
            this.styles.blockTypeStyles[idx].styles = before;
            this.applyBlockStylesToState(blockTypeName, before);
        };
        //
        store.dispatch(pushItemToOpQueue('update-theme-block-type-styles', {
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
            this.applyGlobalVarToState(varName, color.toHEXA());
        }).on('changestop', (_source, instance) => {
            this.applyNewColorAndEmitChangeOp(instance, varName);
        });
        //
        this.pickers.set(varName, pickr);
    }
    /**
     * @param {String} varName
     * @param {PickrColor} hexa
     * @access private
     */
    applyGlobalVarToState(varName, hexa) {
        this.setState({[varName]: hexa.toString(), [`${varName}IsValid`]: true});
        this.props.currentWebPage.setCssVarValue(varName, {type: 'color', value: hexa.slice(0, 4)});
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
