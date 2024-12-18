let pickerLibIsInitialized = false;
let currOpenPicker = null;
let lastEmittedColor;
let pickOrigin = null;
let pickingIsInProgress = false;

const emitPickColor = (colorStr, isFast = false) => {
    if (!isFast)
        currOpenPicker.props.onColorPicked(colorStr);
    else
        currOpenPicker.props.onColorPickedFast(colorStr);
};

const handleOnChange = color => {
    emitPickColor(color, pickingIsInProgress);
    lastEmittedColor = color;
};

const hookUpPickerLib = () => {
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
         * @param {string} color
         * @param {HTMLInputElement} _input
         */
        onChange: handleOnChange
    });

    const picker = document.getElementById('clr-picker');
    const originIds = {
        'clr-color-area': 'color-area',
        'clr-color-marker': 'color-area',
        'clr-hue-slider': 'hue-or-alpha-slider',
        'clr-hue-marker': 'hue-or-alpha-slider',
        'clr-alpha-slider': 'hue-or-alpha-slider',
        'clr-alpha-marker': 'hue-or-alpha-slider',
    };
    const handleMouseOrTouchStart = ({target}) => {
        const origin = originIds[target.id];
        if (origin) {
            pickOrigin = origin;
            pickingIsInProgress = true;
        }
    };
    picker.addEventListener('mousedown', handleMouseOrTouchStart);
    picker.addEventListener('touchstart', handleMouseOrTouchStart);

    const handleMouseOrTouchEnd = e => {
        if (pickOrigin) {
            const lastChangeWasDuringInProgress = pickingIsInProgress;
            pickingIsInProgress = false;

            if (lastChangeWasDuringInProgress) {
                if (pickOrigin === 'hue-or-alpha-slider')
                    emitPickColor(lastEmittedColor, false);

                const isTargetInsidePicker = picker.contains(e.target);
                if (!isTargetInsidePicker)
                    handleOnChange(
                        picker.querySelector('#clr-color-value').value,
                        currOpenPicker.inputElRef.current
                    );
            }
        }
        pickingIsInProgress = false;
        pickOrigin = null;
    };
    document.addEventListener('mouseup', handleMouseOrTouchEnd);
    document.addEventListener('touchend', handleMouseOrTouchEnd);
};

const handlePickerOpened = (cmp, initialValue) => {
    if (currOpenPicker === cmp) return;
    currOpenPicker = cmp;
    lastEmittedColor = initialValue;
    pickOrigin = null;
    pickingIsInProgress = false;
};

class ColorPickerInput extends preact.Component {
    // inputElRef;
    /**
     * @param {string} colorString
     * @param {boolean} emitOnChange = false
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
        if (currOpenPicker) {
            window.Coloris.close();
            currOpenPicker = null;
        }
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
     * @access protected
     */
    componentWillUnmount() {
        currOpenPicker = null;
        lastEmittedColor = undefined;
    }
    /**
     * @param {{onColorPicked: (color: string) => void; initialColorStr?: string; inputId?: string;}} props
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
                    handlePickerOpened(this, initialValue);
                } }
                { ...(inputId ? {id: inputId} : {}) }
                autoComplete="off"
                ref={ this.inputElRef }/>
        </div>;
    }
}

/**
 * @param {string|null} input
 * @returns {string}
 */
function getNormalizedValue(input) {
    return input || (input === null ? '' : '#067bc2');
}

export default ColorPickerInput;
