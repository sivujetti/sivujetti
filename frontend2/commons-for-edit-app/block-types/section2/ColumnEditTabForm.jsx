import LengthValueInput from '../../styles/LengthValueInput.jsx';
import OptionValueInput from '../../styles/OptionValueInput.jsx';
import {__} from '../../edit-app-singletons.js';
import {FormGroupInline} from '../../Form.jsx';
import {colToTransferable} from './Section2CombinedBlockAndStylesEditFormFuncs.js';
/** @typedef {import('./Section2CombinedBlockAndStylesEditFormFuncs.js').ColumnConfigLocalRepr} ColumnConfigLocalRepr */
/** @typedef {import('./Section2CombinedBlockAndStylesEditFormFuncs.js').ColumnConfig} ColumnConfig */

class ColumnEditTabForm extends preact.Component {
    // alignOptions;
    /**
     * @param {{column: ColumnConfigLocalRepr; onPropChanged(propName: keyof ColumnConfig, val: String|Boolean|null): void; onEditEnded(): void;}} props
     */
    constructor(props) {
        super(props);
        this.alignOptions = [
            {value: 'start', label: __('Start')},
            {value: 'center', label: __('Center')},
            {value: 'end', label: __('End')},
            {value: 'baseline', label: __('Baseline')},
            {value: 'stretch', label: __('Stretch')},
            {value: null, label: __('Default')},
        ];
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState(colToTransferable(this.props.column));
    }
    /**
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.column !== this.props.column)
            this.setState(colToTransferable(props.column));
    }
    /**
     * @access protected
     */
    render(_, {width, align, visibility}) {
        return <div class="form-horizontal px-2 py-1 col-12" style="background-color: var(--color-bg-very-light2)">
            <button onClick={ () => this.props.onEditEnded() } class="btn btn-sm" type="button"> &lt; </button>
            <LengthValueInput
                value={ LengthValueInput.valueFromInput(width || 'initial') }
                onValueChanged={ newValAsString => {
                    this.props.onPropChanged('width', newValAsString);
                } }
                labelTranslated={ __('Width') }
                isClearable={ false }
                inputId="section2ColWidth"
                additionalUnits={ ['fr'] }/>
            <OptionValueInput
                value={ OptionValueInput.valueFromInput(align || null) }
                options={ this.alignOptions }
                onValueChanged={ newValAsString => {
                    this.props.onPropChanged('align', newValAsString || null);
                } }
                labelTranslated={ __('Align') }
                inputId="section2Align"/>
            <FormGroupInline>
                <span class="form-label">{ __('Is visible') }?</span>
                <label class="form-checkbox mt-0">
                    <input
                        onClick={ e => this.props.onPropChanged('visibility', e.target.checked ? 'visible' : 'hidden') }
                        checked={ visibility === 'visible' }
                        type="checkbox"
                        class="form-input"
                        name="section2ColIsVisible"/><i class="form-icon"></i>
                </label>
            </FormGroupInline>
        </div>;
    }
}

export default ColumnEditTabForm;
