import LengthValueInput from '../../styles/LengthValueInput.jsx';
import {__} from '../../edit-app-singletons.js';
import {colToTransferable} from './Section2CombinedBlockAndStylesEditFormFuncs.js';

class ColumnEditTabForm extends preact.Component {
    // initialItem;
    /**
     * @access protected
     */
    componentWillMount() {
        this.initialItem = colToTransferable(this.props.column);
        this.setState(colToTransferable(this.props.column));
    }
    /**
     * @param {{column: Section2BlockColumnConfigLocalRepr; onPropChanged(propName: keyof Section2BlockColumnConfig, val: String|Boolea|null): void; onEditEnded(doConfirmChanges: Boolean, todo: todo): void;}} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.column !== this.props.column)
            this.setState(colToTransferable(props.column));
    }
    /**
     * @access protected
     */
    render(_, {width}) {
        return <div class="form-horizontal pt-0">
            <LengthValueInput
                value={ LengthValueInput.valueFromInput(width || 'initial') }
                onValueChanged={ newValAsString => {
                    this.props.onPropChanged('width', newValAsString);
                } }
                labelTranslated={ __('Width') }
                isClearable={ false }
                inputId="section2ColWidth"
                additionalUnits={ ['fr'] }/>
            <button
                onClick={ () => this.endEdit(true) }
                class="btn btn-sm text-tiny btn-primary"
                type="button">Ok</button>
            <button
                onClick={ () => this.endEdit(false) }
                class="btn btn-sm text-tiny"
                type="button">{ __('Cancel') }</button>
            <hr class="mt-1"/>
        </div>;
    }
    /**
     * @param {Boolean} applyChanges
     * @access private
     */
    endEdit(applyChanges) {
        this.props.onEditEnded(applyChanges, applyChanges ? null : this.initialItem);
    }
}

export default ColumnEditTabForm;
