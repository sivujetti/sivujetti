import ColorPickerInput from '../ColorPickerInput.jsx';
import {__} from '../edit-app-singletons.js';
import {FormGroupInline} from '../Form.jsx';
import {Icon} from '../Icon.jsx';

let counter = 0;

/** @type {CanvasRenderingContext2D} */
let helperCanvasCtx;

class ColorValueInput extends preact.Component {
    // inputId;
    /**
     * @param {ValueInputProps<null> & {valueAsString: String|null; onValueChangedFast?: (newRapidlyPickedVal: String) => void;}} props
     */
    constructor(props) {
        super(props);
        this.inputId = `styleColor-${props.inputId || (++counter)}`;
    }
    /**
     * @access protected
     */
    render({valueAsString, labelTranslated, onValueChanged, onValueChangedFast, isClearable, showNotice, noticeDismissedWith}) {
        return <FormGroupInline>
            <label class="form-label p-relative pt-1" htmlFor={ this.inputId } title={ labelTranslated }>
                { labelTranslated }
                { !showNotice ? null : <button
                    onClick={ () => {
                        const doCreateCopy = confirm(__('todo2323'));
                        noticeDismissedWith(doCreateCopy);
                    } }
                    class="btn btn-link btn-sm p-absolute"
                    title={ __('Notice') }
                    style="left: 72%"
                    type="button">
                    <span class="d-flex"><Icon iconId="alert-triangle" className="size-sm color-orange color-saturated"/></span>
                </button> }
            </label>
            <div class="p-relative">
                <ColorPickerInput
                    initialColorStr={ valueAsString }
                    onColorPicked={ onValueChanged }
                    onColorPickedFast={ onValueChangedFast }
                    inputId={ this.inputId }/>
                { isClearable
                    ? <button onClick={ () => { this.props.onValueChanged(null); } }
                        class="btn btn-link btn-xs clear-style-btn"
                        title={ __('Restore default') }>
                            <span class="d-flex"><Icon iconId="circle-x" className="size-xs color-dimmed3"/></span>
                    </button>
                    : null
                }
            </div>
        </FormGroupInline>;
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

export default ColorValueInput;