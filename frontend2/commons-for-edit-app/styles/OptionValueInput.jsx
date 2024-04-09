import {__} from '../edit-app-singletons.js';
import {FormGroupInline} from '../Form.jsx';
import {Icon} from '../Icon.jsx';

let counter = 0;

class OptionValueInput extends preact.Component {
    // inputId;
    /**
     * @param {ValueInputProps<OptionValue & {options: Array<String>;}>} props
     */
    constructor(props) {
        super(props);
        this.inputId = `styleOption-${props.inputId || (++counter)}`;
    }
    /**
     * @access protected
     */
    render({value, options, isClearable, labelTranslated, showNotice, noticeDismissedWith}) {
        const selectedVisible = value.selected;
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
                <select
                    class="form-select"
                    value={ selectedVisible }
                    onChange={ e => this.props.onValueChanged(e.target.value) }
                    id={ this.inputId }>
                { options.map(({label, value}) =>
                    <option value={ value }>{ label }</option>
                ) }
                </select>
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
