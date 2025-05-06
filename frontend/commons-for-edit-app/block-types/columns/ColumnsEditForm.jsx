import {__} from '../../edit-app-singletons.js';
import {
    FormGroupInline,
} from '../../Form.jsx';

/** @extends {preact.Component<any, any>} */
class ColumnsEditForm extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.alignYOptions = [
            {val: '', label: __('Default')},
            {val: 'start', label: __('Top')},
            {val: 'center', label: __('Center')},
            {val: 'end', label: __('Bottom')},
        ];
        const {block} = this.props;
        const alignY = block.config.alignY;
        this.setState({alignY});
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        const {block} = props;
        if (block === this.props.block || !props.lastBlockTreeChangeEventInfo?.isUndoOrRedo)
            return;
        if (this.state.alignY !== block.config.alignY)
            this.setState({alignY: block.config.alignY});
    }
    /**
     * @access protected
     */
    render(_, {alignY}) {
        return <div class="form-horizontal pt-0">
            <FormGroupInline>
                <label htmlFor="alignY" class="form-label">{ __('Align ↕') }</label>
                <select value={ alignY || '' } onChange={ e => {
                    const {value} = e.target;
                    if (value)
                        this.props.emitValueChanged({...this.props.block.config, alignY: value}, 'config');
                    else {
                        const {alignY, ...theRest} = this.props.block.config;
                        this.props.emitValueChanged(theRest, 'config');
                    }
                } } class="form-input form-select" id="alignY">{
                    this.alignYOptions.map(({val, label}) =>
                        <option value={ val }>{ label }</option>
                    )
                }</select>
            </FormGroupInline>
        </div>;
    }
}

export default ColumnsEditForm;
