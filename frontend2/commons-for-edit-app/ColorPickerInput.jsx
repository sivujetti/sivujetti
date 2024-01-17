import {timingUtils} from './interal-wrapper.js';

/** @type {Array<preact.RefObject<ColorPickerInput>>} */
const cmpRefs = [];

const interactifyAllInputs = timingUtils.debounce(() => {
    window.Coloris({
        el: '.coloris',
        wrap: false,
        swatches: [
            '#067bc2',
            '#84bcda',
            '#80e377',
            '#ecc30b',
            '#f37748',
            '#d56062'
        ],
        /**
         * @param {String} color
         * @param {HTMLInputElement} input
         */
        onChange: (color, input) => {
            const target = cmpRefs.find(cmp => cmp.inputElRef.current === input);
            if (target) target.props.onColorPicked(color);
            else window.console.warn('Failed to locate component for', input);
        }
    });
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
        if (cmpRefs.indexOf(this) < 0) cmpRefs.push(this);
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        const idx = cmpRefs.indexOf(this);
        if (idx > -1) cmpRefs.splice(idx, 1);
    }
    /**
     * @access protected
     */
    componentDidMount() {
        // Hook|rehook all inputs currently mounted to env.document
        interactifyAllInputs();
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
            this.setColor(props.initialColorStr);
    }
    /**
     * @param {{onColorPicked: (color: String) => void; initialColorStr?: String; inputId?: String;}} props
     * @access protected
     */
    render({initialColorStr, inputId}) {
        const initialValue = initialColorStr || (initialColorStr === null ? '' : '#067bc2');
        return <div class="clr-field" style={ `color: ${initialValue}` }>
            <button type="button" aria-labelledby="clr-open-label"></button>
            <input
                type="text"
                class="coloris form-input"
                value={ initialValue }
                ref={ this.inputElRef }
                { ...(inputId ? {id: inputId} : {}) }/>
        </div>;
    }
}

export default ColorPickerInput;
