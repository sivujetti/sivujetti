import {api, http, __, env} from '@sivujetti-commons-for-edit-app';
import LoadingSpinner from '../commons/LoadingSpinner.jsx';
import toasters from '../commons/Toaster.jsx';
import store, {pushItemToOpQueue} from '../store.js';

class GlobalStylesSection extends preact.Component {
    // activeThemeId;
    // allStyles;
    // pickers;
    // helperPicker;
    /**
     * @access protected
     */
    componentDidMount() {
        this.setState({numStyles: null});
        this.activeThemeId = api.getActiveTheme().id;
        http.get(`/api/themes/${this.activeThemeId}/styles`)
            .then(allStyles => {
                this.allStyles = allStyles;
                this.pickers = new Map;
                // {style1: color, style1IsValid: true, style2: color, style2IsValid: true ...}
                this.setState(createState(this.allStyles));
            })
            .catch(env.window.console.error);
    }
    /**
     * @param {{isVisible: Boolean; onVarChanged: (varName: String, value: String) => void;}} props
     * @access protected
     */
    render(_, {numStyles}) {
        if (numStyles === undefined)
            return null;
        if (numStyles === null)
            return <LoadingSpinner/>;
        return <div class="global-styles mt-2 pt-2">
            { this.allStyles.map(({name, friendlyName}) =>
            <div class="d-flex">
                <div ref={ el => this.createColorPickerFor(name, el) }></div>
                <label>
                    <span>{ __(friendlyName) }</span>
                    <input
                        onInput={ e => this.handleColorInputValChanged(e, name) }
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
    }
    /**
     * @param {Event} e
     * @param {String} varName
     * @access private
     */
    handleColorInputValChanged(e, varName) {
        const wasSuccefullyParsed = this.helperPicker.setColor(e.target.value);
        const newState = {[varName]: e.target.value,
                          [`${varName}IsValid`]: false};
        if (!wasSuccefullyParsed) {
            this.setState(newState);
            return;
        }
        const canonicalized = this.helperPicker.getColor().toHEXA();
        if (canonicalized.toString() === '#000000' && /^[a-zA-Z]+$/.test(e.target.value)) {
            this.setState(newState);
            return;
        }
        this.applyVarToState(varName, canonicalized);
        this.applyNewColorAndEmitChangeOp(this.pickers.get(varName), varName, this.helperPicker.getColor());
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
        const before = JSON.parse(JSON.stringify(this.allStyles));
        const idx = this.allStyles.findIndex(s => s.name === varName);
        const hexOrHexa = instance.getColor().toHEXA().slice(0, 4);
        this.allStyles[idx].value.value = hexOrHexa.length === 4 ? hexOrHexa : hexOrHexa.concat('ff');
        const after = JSON.parse(JSON.stringify(this.allStyles));
        //
        store.dispatch(pushItemToOpQueue('update-theme-allStyles', {
            doHandle: (_$newStyles, _$stylesBefore, $this) => {
                return http.put(`/api/themes/${$this.activeThemeId}/styles`, {allStyles: $this.allStyles})
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
                $this.allStyles = $stylesBefore; // Mutate
                const newState = createState($this.allStyles);
                $this.setState(newState);
                $this.allStyles.forEach(({name}) => {
                    $this.pickers.get(name).setColor(newState[name]);
                });
            },
            args: [after, before, this],
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
            this.applyVarToState(varName, color.toHEXA());
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
    applyVarToState(varName, hexa) {
        this.setState({[varName]: hexa.toString(), [`${varName}IsValid`]: true});
        this.props.onVarChanged(varName, {type: 'color', value: hexa.slice(0, 4)});
    }
}

/**
 * @param {Array<RawCssRule>} allStyles
 * @returns {{[key: String]: String;}}
 */
function createState(allStyles) {
    return allStyles.filter(({value}) => value.type === 'color').reduce((obj, {name, value}) =>
        Object.assign(obj, {[name]: `#${value.value.join('')}`, [`${name}IsValid`]: true})
    , {numStyles: allStyles.length});
}

/**
 * @typedef {([String, String, String, String, () => String])} PickrColor
 */

export default GlobalStylesSection;
