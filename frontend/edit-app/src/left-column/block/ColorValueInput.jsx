import {__, signals, FormGroupInline, Icon} from '@sivujetti-commons-for-edit-app';
import {sharedSignals} from '../../shared.js';

/** @type {CanvasRenderingContext2D} */
let helperCanvasCtx;

let metaKeyIsPressed = false;

sharedSignals.on('meta-key-pressed-or-released', isDown => {
    metaKeyIsPressed = isDown;
});

class ColorValueInput extends preact.Component {
    // unregisterSignalListener;
    // resetValueIsPending;
    /**
     * @param {ValueInputProps<ColorValue>} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        const incoming = props.valueReal;
        if ((this.props.valueReal.data !== incoming.data || this.props.valueReal.type !== incoming.type) && this.pickr) {
            this.pickr.setColor(incoming.data);
        }
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.unregisterSignalListener = signals.on('web-page-click-received', () => {
            if (this.pickr && this.pickr.isOpen()) this.pickr.hide();
        });
        this.resetValueIsPending = false;
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregisterSignalListener();
    }
    /**
     * @access protected
     */
    render({valueReal, isClearable, labelTranslated, showNotice, noticeDismissedWith}) {
        return <FormGroupInline className={ `has-visual-color-input flex-centered${wc_hex_is_light(valueReal.data) ? ' is-very-light-color' : ''}` }>
            <label class="form-label p-relative pt-1" title={ labelTranslated }>
                { labelTranslated }
                { !showNotice ? null : <button
                    onClick={ () => {
                        const doCreateCopy = confirm(__('todo2323'));
                        noticeDismissedWith(doCreateCopy);
                    } }
                    class="btn btn-link btn-sm p-absolute"
                    title={ __('Notice') }
                    style="left: 82%"
                    type="button">
                    <span class="d-flex"><Icon iconId="alert-triangle" className="size-sm color-orange color-saturated"/></span>
                </button> }
            </label>
            {/* the real div.pickr (this.movingPickContainer) will appear here */}
            {/* this element will disappear after clicking */}
            <div class="d-inline-flex p-relative">
            <div class="pickr disappearing-pickr">
                <button
                    onClick={ this.replaceDisappearingBox.bind(this) }
                    style={ `--pcr-color:${valueReal.data};` }
                    class="pcr-button"
                    type="button"
                    aria-label="toggle color picker dialog"
                    role="button"></button>
            </div>
            { isClearable
                ? <button onClick={ () => {
                    this.resetValueIsPending = true;
                    this.props.onVarValueChanged(null);
                    setTimeout(() => { this.resetValueIsPending = false; }, 200);
                } } class="btn btn-link btn-sm" title={ __('Restore default') } style="position: absolute;right: -1.8rem;top: .1rem;">
                    <span class="d-flex"><Icon iconId="circle-x" className="size-xs color-dimmed3"/></span>
                </button>
                : null
            }
            </div>
        </FormGroupInline>;
    }
    /**
     * @param {Event} e
     * @access private
     */
    replaceDisappearingBox(e) {
        const disappearingColorBox = e.target.parentElement; // div.disappearing-pickr
        disappearingColorBox.classList.add('d-none');
        //
        const realColorBox = document.createElement('div');
        disappearingColorBox.parentElement.insertBefore(realColorBox, disappearingColorBox);
        this.pickr = window.Pickr.create({
            el: realColorBox,
            theme: 'nano',
            default: this.props.valueReal.data,
            components: {preview: true, opacity: true, hue: true, interaction: {input: true}}
        });
        //
        let nonCommittedHex;
        this.pickr.on('change', (color, _source, _instance) => {
            let valOrGetValBundle;
            const {selector, wrapCss} = this.props.data;
            if (!this.resetValueIsPending) {
                nonCommittedHex = `#${color.toHEXA().slice(0, 4).join('')}`;
                valOrGetValBundle = !wrapCss ? nonCommittedHex : () => ({supportingCss: wrapCss, varVal: nonCommittedHex});
            } else {
                valOrGetValBundle = 'initial';
                this.resetValueIsPending = false;
            }
            signals.emit('visual-styles-var-value-changed-fast', selector, this.props.varName, valOrGetValBundle, 'color');
        }).on('changestop', (_source, instance) => {
            if (metaKeyIsPressed) {
                sharedSignals.emit('meta-key-pressed-or-released', false);
            }
            if (this.props.valueReal.data === nonCommittedHex) return;
            // Update realColorBox's color
            instance.setColor(nonCommittedHex);
            // Commit
            this.props.onVarValueChanged(nonCommittedHex);
        });
        setTimeout(() => {
            this.pickr.show();
        }, 10);
    }
    /**
     * @param {String} input examples: '#000', ' #ffffff '
     * @returns {ColorValue|null}
     */
    static valueFromInput(input) {
        if (input === 'initial')
            return {data: '#000000ff', type: 'hexa'};
        // https://stackoverflow.com/a/47355187
        if (!helperCanvasCtx) helperCanvasCtx = document.createElement('canvas').getContext('2d');
        else helperCanvasCtx.fillStyle = '#000'; // clear previous
        helperCanvasCtx.fillStyle = input;
        const out = helperCanvasCtx.fillStyle;
        // https://stackoverflow.com/a/49974627
        return {data: out[0] === '#'
            ? `${out}ff`
            : '#' + (
                out.substring('rgba('.length, out.length - 1) // 'rgba(0, 0, 0, 0.73)' -> '0, 0, 0, 0.73'
                    .split(',') // '0, 0, 0, 0.73' -> ['0', ' 0', ' 0', ' 0.73']
                    .map((str, i) => i < 3
                        ? (parseFloat(str) | 1 << 8).toString(16).slice(1)
                        : (str != ' 0' ? parseFloat(str).toString(16).substring(2,4) : '00')
                    ) // ['0', ' 0', ' 0', ' 0.73'] -> ['00', '00', '00' , 'bb']
                    .join('')
            ), type: 'hexa'
        };
    }
    /**
     * @param {ColorValue} value
     * @returns {String}
     */
    static valueToString(value) {
        return `${value.data}`;
    }
}

/**
 * https://stackoverflow.com/a/51567564
 *
 * @param {String} hexa
 * @param {Number} howLight = 220
 * @param {Boolean} multiplyByAlpha = false
 * @param {Boolean}
 */
function wc_hex_is_light(hexa, howLight = 220, multiplyByAlpha = false) {
    const c_r = parseInt(hexa.substring(1, 3), 16);
    const c_g = parseInt(hexa.substring(3, 5), 16);
    const c_b = parseInt(hexa.substring(5, 7), 16);
    const a = !multiplyByAlpha ? 1 : (parseInt(hexa.substring(7, 9), 16) / 255);
    const brightness = (((c_r * 299) + (c_g * 587) + (c_b * 114)) * a) / 1000;
    return brightness > howLight;
}

export default ColorValueInput;
