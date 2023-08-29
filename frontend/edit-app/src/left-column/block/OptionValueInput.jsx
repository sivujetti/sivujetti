import {__, FormGroupInline, Icon} from '@sivujetti-commons-for-edit-app';

class OptionValueInput extends preact.Component {
    /**
     * @access protected
     */
    render({valueReal, argsCopy, isClearable, labelTranslated, showNotice, noticeDismissedWith}) {
        const options = argsCopy;
        const selectedVisible = valueReal.selected;
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
                <select
                    class="form-select"
                    value={ selectedVisible }
                    onChange={ e => this.props.onVarValueChanged(e.target.value) }>
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
     * @param {OptionValue} value
     * @returns {String}
     */
    static valueToString(value) {
        return `${value.selected}`;
    }
}

export default OptionValueInput;
