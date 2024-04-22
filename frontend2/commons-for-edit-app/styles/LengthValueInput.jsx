import {env} from '@sivujetti-commons-for-web-pages';
import {__} from '../edit-app-singletons.js';
import {
    FormGroupInline,
    hookForm,
    Input,
    InputErrors,
    reHookValues,
} from '../Form.jsx';
import {Icon} from '../Icon.jsx';
import {isUndoOrRedo, timingUtils} from '../utils.js';
import {createInputId} from './ValueInputFuncs.js';

class LengthValueInput extends preact.Component {
    // inputId;
    /**
     * @param {ValueInputProps<LengthValue>} props
     */
    constructor(props) {
        super(props);
        this.inputId = createInputId('styleLength', props);
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const throttler = createThrottler(this.handleInput.bind(this));
        const {num, unit} = this.props.value;
        this.setState(hookForm(this, [
            {name: 'num', value: num, validations: [['maxLength', 32], [{doValidate: val =>
                !val.length || !isNaN(parseFloat(val))
            , errorMessageTmpl: __('%s must be a number').replace('%s', '{field}')}, null]],
                label: this.props.labelTranslated, onAfterValueChanged: (value, hasErrors, source) => {
                    throttler(value, hasErrors, source);
                }},
        ], {
            unit,
        }));
    }
    /**
     * @access protected
     */
    componentWillReceiveProps(props) {
        const incoming = props.value;
        if (this.state.values.num !== incoming.num)
            reHookValues(this, [{name: 'num', value: incoming.num}]);
        if (this.state.unit !== incoming.unit)
            this.setState({unit: incoming.unit});
    }
    /**
     * @access protected
     */
    render({value, isClearable, labelTranslated, defaultThemeValue, showNotice, noticeDismissedWith, additionalUnits}, {unit}) {
        const {num} = value;
        return <FormGroupInline className="has-visual-length-input">
            <label htmlFor={ this.inputId } class="form-label p-relative pt-1" title={ labelTranslated }>
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
                <div class="input-group">
                    <Input vm={ this } prop="num" id={ this.inputId } placeholder={ defaultThemeValue?.num || '1.4' } autoComplete="off"/>
                    <select
                        onChange={ e => {
                            if (num)
                                this.props.onValueChanged(`${num}${e.target.value}`);
                            else
                                this.setState({unit: e.target.value});
                        } }
                        class="form-input input-group-addon addon-sm form-select"
                        value={ unit }>{ ['rem', 'px', '%', 'em', 'vh', 'vw', 'vb', 'vmin', 'vmax', ...(additionalUnits || [])].map(ltype =>
                            <option value={ ltype }>{ ltype }</option>
                        )
                    }</select>
                </div>
                { isClearable
                    ? <button onClick={ () => { this.props.onValueChanged(null); } }
                        class="btn btn-link btn-xs clear-style-btn"
                        title={ __('Restore default') }>
                            <span class="d-flex"><Icon iconId="circle-x" className="size-xs color-dimmed3"/></span>
                    </button>
                    : null
                }
            </div>
            <InputErrors vm={ this } prop="num"/>
        </FormGroupInline>;
    }
    /**
     * @param {String|null} val
     * @param {Boolean} hasErrors = false
     * @param {String} flags = null
     * @access private
     */
    handleInput(val, hasErrors = false, flags = null) {
        if (hasErrors)
            return;
        if (flags === 'is-throttled')
            return;
        this.props.onValueChanged(val ? `${val}${this.state.unit}` : null);
    }
    /**
     * @param {String} input examples: '1.4rem', '1.4 rem ', '12px', 'initial'
     * @param {String} initialUnit = 'rem'
     * @returns {LengthValue|null}
     */
    static valueFromInput(input, initialUnit = 'rem') {
        if (input === 'initial')
            return {num: '', unit: initialUnit};
        const chars = input.split('').filter(ch => ch !== ' ');
        const firstAlpha = chars.findIndex(ch => {
            const cc = ch.charCodeAt(0);
            return ((cc >= 65 && cc <= 90) || (cc >= 97 && cc <= 122)) || ch === '%';
        });
        if (firstAlpha > 0)
            return {num: chars.slice(0, firstAlpha).join(''),
                    unit: chars.slice(firstAlpha).join('')};
        return null; // not supported
    }
    /**
     * @param {LengthValue} value
     * @returns {String}
     */
    static valueToString(value) {
        return typeof value.num === 'string' && value.num.length ? `${value.num}${value.unit}` : 'initial';
    }
}

/**
 * @param {(val: String|null, hasErrors: Boolean, flags: String) => any} fast
 * @returns {(val: String|null, hasErrors: Boolean, source: String) => any}
 */
function createThrottler(fast) {
    let throttled = null;
    return (val, hasErrors = false, source = null) => {
        if (!throttled)
            throttled = timingUtils.debounce(fast, env.normalTypingDebounceMillis);

        if (!isUndoOrRedo(source)) {
            //
            fast(val, hasErrors, 'is-throttled');
            //
            throttled(val, hasErrors, null);
        }
    };
}

export default LengthValueInput;
