
import {env} from '@sivujetti-commons-for-web-pages';
import setFocusTo from '../../auto-focusers.js';
import {__} from '../../edit-app-singletons.js';
import {
    FormGroupInline,
    Input,
    InputErrors,
    hookForm,
    reHookValues,
    unhookForm,
} from '../../Form.jsx';
import {isUndoOrRedo} from '../../utils.js';

class ColumnsBlockEditForm extends preact.Component {
    // numColumnsEl;
    /**
     * @access protected
     */
    componentWillMount() {
        this.numColumnsEl = preact.createRef();
        const {block, emitValueChanged} = this.props;
        const {numColumns, takeFullWidth} = block;
        this.setState(hookForm(this, [
            {name: 'numColumns', value: numColumns, validations: [['min', 0], ['max', 12]],
             label: __('Num columns'), type: 'number', step: '1', onAfterValueChanged: (value, hasErrors) => {
                if (!hasErrors) emitValueChanged(value, 'numColumns'); }},
        ], {
            takeFullWidth: takeFullWidth,
        }));
    }
    /**
     * @access protected
     */
    componentDidMount() {
        setFocusTo(this.numColumnsEl);
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        unhookForm(this);
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        const {block} = props;
        if (block === this.props.block)
            return;
        if (isUndoOrRedo(props.lastBlockTreeChangeEventInfo.ctx) && this.state.values.numColumns !== block.numColumns)
            reHookValues(this, [{name: 'numColumns', value: block.numColumns}]);
        if (this.state.takeFullWidth !== block.takeFullWidth)
            this.setState({takeFullWidth: block.takeFullWidth});
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    render(_, {takeFullWidth}) {
        return <div class="form-horizontal pt-0">
            <FormGroupInline>
                <label htmlFor="numColumns" class="form-label">{ __('Num columns') }</label>
                <Input vm={ this } prop="numColumns" id="numColumns" ref={ this.numColumnsEl }/>
                <InputErrors vm={ this } prop="numColumns"/>
            </FormGroupInline>
            <FormGroupInline>
                <span class="form-label">{ __('Full width') }</span>
                <label class="form-checkbox mt-0">
                    <input
                        onClick={ this.emitSetFullWidth.bind(this) }
                        checked={ takeFullWidth }
                        type="checkbox"
                        class="form-input"/><i class="form-icon"></i>
                </label>
            </FormGroupInline>
        </div>;
    }
    /**
     * @param {Event} e
     * @access private
     */
    emitSetFullWidth(e) {
        const takeFullWidth = e.target.checked ? 1 : 0;
        this.props.emitValueChanged(takeFullWidth, 'takeFullWidth');
    }
}

export default ColumnsBlockEditForm;
