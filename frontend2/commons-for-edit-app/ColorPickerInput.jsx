import {timingUtils} from './utils.js';

let pickerLibIsInitialized = false;
let currOpenPicker = null;

const emitPickColor = (colorStr, input, isFast = false) => {
    if (!isFast)
        currOpenPicker.props.onColorPicked(colorStr);
    else
        ; // todo
};

const hookUpPickerLib = timingUtils.debounce(() => {
    let pickOrigin = null;
    let pickingIsInProgress = false;
    let lastColor;

    window.Coloris({
        el: '.coloris',
        wrap: false,
        clearButton: true,
        swatches: [
            '#fff',
            '#010101',
            '#ffffff00',
        ],
        /**
         * @param {String} color
         * @param {HTMLInputElement} input
         */
        onChange: (color, input) => {
            emitPickColor(color, input, pickingIsInProgress);
            lastColor = color;
        }
    });

    const picker = document.getElementById('clr-picker');
    const handleDown = ({target}) => {
        if (target.id === 'clr-color-area' || target.id === 'clr-color-marker') {
            pickOrigin = 'color-area';
            pickingIsInProgress = true;
        } else if (target.id === 'clr-hue-slider' || target.id === 'clr-hue-marker' ||
                  target.id === 'clr-alpha-slider' || target.id === 'clr-alpha-marker') {
            pickOrigin = 'hue-or-alpha-slider';
            pickingIsInProgress = true;
        }
    };
    picker.addEventListener('mousedown', handleDown);
    picker.addEventListener('touchstart', handleDown);

    const onEnd = () => {
        if (pickOrigin) {
            const lastChangeWasDuringInProgress = pickingIsInProgress;
            pickingIsInProgress = false;
            if (lastChangeWasDuringInProgress)
                emitPickColor(lastColor, lastColor, false);
        }
        pickingIsInProgress = false;
        pickOrigin = null;
    };
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
}, 80);

class ColorPickerInput extends preact.Component {
    // inputElRef;
    /**
     * @param {String} colorString
     * @param {Boolean} emitOnChange = false
     * @access public
     */
    setColor(colorString, emitOnChange = false) {
        const input = this.inputElRef.current;
        input.value = colorString;
        input.dispatchEvent(new Event('input', {bubbles: true}));
        if (emitOnChange) throw new Error('not implemented');
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.inputElRef = preact.createRef();
    }
    /**
     * @access protected
     */
    componentDidMount() {
        // Initialize picker library only once
        if (!pickerLibIsInitialized) {
            pickerLibIsInitialized = true;
            hookUpPickerLib();
        }
    }
    /**
     * @access protected
     */
    shouldComponentUpdate() {
        return false;
    }
    /**
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.initialColorStr !== this.props.initialColorStr)
            this.setColor(getNormalizedValue(props.initialColorStr));
    }
    /**
     * @param {{onColorPicked: (color: String) => void; initialColorStr?: String; inputId?: String;}} props
     * @access protected
     */
    render({initialColorStr, inputId}) {
        const initialValue = getNormalizedValue(initialColorStr);
        return <div class="clr-field" style={ `color: ${initialValue}` }>
            <button type="button" aria-labelledby="clr-open-label"></button>
            <input
                type="text"
                class="coloris form-input"
                value={ initialValue }
                placeholder="-"
                onClick={ () => {
                    if (!pickerLibIsInitialized)
                        return;
                    if (currOpenPicker !== this)
                        currOpenPicker = this;
                } }
                { ...(inputId ? {id: inputId} : {}) }
                ref={ this.inputElRef }/>
        </div>;
    }
}

/**
 * @param {String|null} input
 * @returns {String}
 */
function getNormalizedValue(input) {
    return input || (input === null ? '' : '#067bc2');
}

export default ColorPickerInput;
