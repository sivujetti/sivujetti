import {__, hookForm, FormGroupInline, Input,
        InputErrors, reHookValues, Icon} from '@sivujetti-commons-for-edit-app';

const NO_VALUE = '?';

class LengthValueInput extends preact.Component {
    // numInternal;
    /**
     * @access protected
     */
    componentWillMount() {
        const {num, unit} = LengthValueInput.normalize(this.props.valueReal);
        this.numInternal = num;
        const numNorm = normValueNum(num);
        if (this.props.varName === 'paddingTop_Section_u19') {
            console.log('inp',this.props.valueReal);
            const a = this.props.valueReal || {num: NO_VALUE, unit: 'rem'}
            console.log('a',a);
console.log('intern',this.numInternal);
console.log('nortm',numNorm);
        }
        this.setState(hookForm(this, [
            {name: 'num', value: numNorm, validations: [['maxLength', 32], [{doValidate: val =>
                !val.length || !isNaN(parseFloat(val))
            , errorMessageTmpl: __('%s must be a number').replace('%', '{field}')}, null]],
                label: this.props.labelTranslated, onAfterValueChanged: (value, hasErrors) => {
                    if (!hasErrors) this.props.onVarValueChanged(value ? `${value}${this.state.unit}` : null);
                }},
        ], {
            unit,
        }));
    }
    /**
     * @param {ValueInputProps<LengthValue>} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        const incoming = LengthValueInput.normalize(props.valueReal);
        const numNorm = normValueNum(incoming.num);
        if (this.state.values.num !== numNorm) {
            reHookValues(this, [{name: 'num', value: numNorm}]);
            this.numInternal = incoming.num;
        }
        if (this.state.unit !== incoming.unit)
            this.setState({unit: incoming.unit});
    }
    /**
     * @access protected
     */
    render(props, {unit}) {
        const norm = LengthValueInput.normalize(props.valueReal);
        const {labelTranslated, isClearable} = props;
        return <FormGroupInline className="has-visual-length-input">
            <label htmlFor="num" class="form-label p-relative pt-1" title={ labelTranslated }>
                { labelTranslated }
                { !props.showNotice ? null : <button
                    onClick={ () => {
                        const doCreateCopy = confirm(__('todo2323'));
                        props.noticeDismissedWith(doCreateCopy);
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
                    <Input vm={ this } prop="num" placeholder="1.4" autoComplete="off"/>
                    <select
                        onChange={ e => this.props.onVarValueChanged(`${norm.num}${e.target.value}`) }
                        class="form-input input-group-addon addon-sm form-select"
                        value={ unit }>{
                        ['rem', 'px', '%', 'em', 'vh', 'vw', 'vb', 'vmin', 'vmax'].map(ltype =>
                            <option value={ ltype }>{ ltype }</option>
                        )
                    }</select>
                </div>
                { isClearable
                    ? <button onClick={ () => { this.props.onVarValueChanged(null); } }
                        class="btn btn-link btn-sm"
                        title={ __('Restore default') }
                        style="position: absolute;right: -1.8rem;top: .1rem;">
                        <span class="d-flex"><Icon iconId="circle-x" className="size-xs color-dimmed3"/></span>
                    </button>
                    : null
                }
            </div>
            <InputErrors vm={ this } prop="num"/>
        </FormGroupInline>;
    }
    /**
     * @param {String} input examples: '1.4rem', '1.4 rem ', '12px'
     * @returns {LengthValue|null}
     */
    static valueFromInput(input) {
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
     * @param {LengthValue|null} input
     * @returns {LengthValue}
     */
    static normalize(input) {
        return input || {num: NO_VALUE, unit: 'rem'};
    }
    /**
     * @param {LengthValue} value
     * @returns {String}
     */
    static valueToString(value) {
        return `${typeof value.num === 'string' && value.num.length ? value.num : NO_VALUE}${value.unit}`;
    }
}

/**
 * @param {String} num
 * @returns {String}
 */
function normValueNum(num) {
    return num !== NO_VALUE ? num : '';
}

export default LengthValueInput;
