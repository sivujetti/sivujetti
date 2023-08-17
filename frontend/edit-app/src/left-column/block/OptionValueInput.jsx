import {__, FormGroupInline, Icon} from '@sivujetti-commons-for-edit-app';

class OptionValueInput extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        const {selected} = OptionValueInput.normalize(this.props.valueReal);
        this.setState({selected, options: this.props.argsCopy});
    }
    /**
     * @param {ValueInputProps<OptionValue>} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        const norm = OptionValueInput.normalize(props.valueReal);
        if (this.state.selected !== norm.selected)
            this.setState({selected: norm.selected});
    }
    /**
     * @access protected
     */
    render({labelTranslated, isClearable, showNotice, noticeDismissedWith}, {selected, options}) {
        return <FormGroupInline>
            <label class="form-label p-relative pt-1" title={ labelTranslated }>
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
                <select class="form-select" value={ selected } onChange={ e => this.props.onVarValueChanged(e.target.value) }>
                { options.map(text =>
                    <option value={ text }>{ text }</option>
                ) }
                </select>
                { isClearable
                    ? <button onClick={ () => { this.props.onVarValueChanged(null); } } class="btn btn-link btn-sm" title={ __('Restore default') } style="position: absolute;right: -1.8rem;top: .1rem;">
                        <span class="d-flex"><Icon iconId="circle-x" className="size-xs color-dimmed3"/></span>
                    </button>
                    : null
                }
            </div>
        </FormGroupInline>;
    }
    /**
     * @param {String} input examples: 'inline-block', 'Fira Sans'
     * @returns {OptionValue|null}
     */
    static valueFromInput(input) {
        return {selected: input};
    }
    /**
     * @param {OptionValue|null} input
     * @returns {OptionValue}
     */
    static normalize(input) {
        return input || {selected: null};
    }
    /**
     * @param {OptionValue} value
     * @returns {String}
     */
    static valueToString(value) {
        return `${value.selected}`;
    }
}

export default OptionValueInput;
