import {__} from '../edit-app-singletons.js';
import {FormGroupInline} from '../Form.jsx';
import {Icon} from '../Icon.jsx';
import {createInputId} from './ValueInputFuncs.js';

class OptionValueInput extends preact.Component {
    // inputId;
    /**
     * @param {ValueInputProps<OptionValue & {options: Array<{label: String; value: String;}>;}>} props
     */
    constructor(props) {
        super(props);
        this.inputId = createInputId('styleOption', props);
    }
    /**
     * @access protected
     */
    render({value, options, defaultThemeValue, isClearable, labelTranslated}) {
        const selectedVisible = value.selected || defaultThemeValue?.selected;
        return <FormGroupInline>
            <label class="form-label p-relative pt-1" htmlFor={ this.inputId } title={ labelTranslated }>
                { labelTranslated }
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
     * @param {String|null} input examples: 'inline-block', 'Fira Sans'
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
