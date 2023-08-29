import {__, hookForm, FormGroupInline, Input,
        InputErrors, reHookValues, Icon} from '@sivujetti-commons-for-edit-app';

class LengthValueInput extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        const {num, unit} = this.props.valueReal;
        this.setState(hookForm(this, [
            {name: 'num', value: num, validations: [['maxLength', 32], [{doValidate: val =>
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
        const incoming = props.valueReal;
        if (this.state.values.num !== incoming.num)
            reHookValues(this, [{name: 'num', value: incoming.num}]);
        if (this.state.unit !== incoming.unit)
            this.setState({unit: incoming.unit});
    }
    /**
     * @access protected
     */
    render({valueReal, isClearable, labelTranslated, showNotice, noticeDismissedWith}, {unit}) {
        const {num} = valueReal;
        return <FormGroupInline className="has-visual-length-input">
            <label htmlFor="num" class="form-label p-relative pt-1" title={ labelTranslated }>
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
                    <Input vm={ this } prop="num" placeholder="1.4" autoComplete="off"/>
                    <select
                        onChange={ e => {
                            if (num)
                                this.props.onVarValueChanged(`${num}${e.target.value}`);
                            else
                                this.setState({unit: e.target.value});
                        } }
                        class="form-input input-group-addon addon-sm form-select"
                        value={ unit }>{ ['rem', 'px', '%', 'em', 'vh', 'vw', 'vb', 'vmin', 'vmax'].map(ltype =>
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
     * @param {String} input examples: '1.4rem', '1.4 rem ', '12px', 'initial'
     * @returns {LengthValue|null}
     */
    static valueFromInput(input) {
        if (input === 'initial')
            return {num: '', unit: 'rem'};
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

export default LengthValueInput;
