import {__, env, hookForm, unhookForm, reHookValues, Input, InputErrors, FormGroupInline} from '@sivujetti-commons-for-edit-app';
import {validationConstraints} from '../constants.js';
import setFocusTo from './auto-focusers.js';

class ColumnsBlockEditForm extends preact.Component {
    // numColumnsEl;
    /**
     * @param {RawBlockData} snapshot
     * @access public
     */
    overrideValues(snapshot) {
        reHookValues(this, [{name: 'numColumns', value: snapshot.numColumns.toString()},
                            {name: 'cssClass', value: snapshot.cssClass}]);
        this.setState({takeFullWidth: snapshot.takeFullWidth});
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const {block, onValueChanged} = this.props;
        this.numColumnsEl = preact.createRef();
        this.setState(hookForm(this, [
            {name: 'numColumns', value: block.numColumns, validations: [['min', 0], ['max', 12]],
             label: __('Num columns'), type: 'number', step: '1', onAfterValueChanged: (value, hasErrors) => {
                 onValueChanged(parseInt(value), 'numColumns', hasErrors, env.normalTypingDebounceMillis); }},
            {name: 'cssClass', value: block.cssClass, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]], label: __('Css classes'),
             onAfterValueChanged: (value, hasErrors) => { onValueChanged(value, 'cssClass', hasErrors, env.normalTypingDebounceMillis); }},
        ], {
            takeFullWidth: block.takeFullWidth,
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
    render(_, {takeFullWidth}) {
        if (!this.state.values) return;
        return <div class="form-horizontal pt-0">
            <FormGroupInline>
                <label htmlFor="numColumns" class="form-label">{ __('Num columns') }</label>
                <Input vm={ this } prop="numColumns" ref={ this.numColumnsEl }/>
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
            <FormGroupInline>
                <label htmlFor="cssClass" class="form-label">{ __('Css classes') }</label>
                <Input vm={ this } prop="cssClass"/>
                <InputErrors vm={ this } prop="cssClass"/>
            </FormGroupInline>
        </div>;
    }
    /**
     * @param {Event} e
     * @access private
     */
    emitSetFullWidth(e) {
        const takeFullWidth = e.target.checked ? 1 : 0;
        this.setState({takeFullWidth});
        this.props.onValueChanged(takeFullWidth, 'takeFullWidth');
    }
}

export default () => {
    const initialData = {
        numColumns: 2,
        takeFullWidth: 1,
        cssClass: ''
    };
    const name = 'Columns';
    return {
        name,
        friendlyName: 'Columns',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-generic-wrapper',
        icon: 'layout-columns',
        reRender({numColumns, takeFullWidth, cssClass, id}, renderChildren) {
            return ['<div class="jet-columns num-cols-', Math.floor(numColumns),
                takeFullWidth ? '' : ' inline',
                !cssClass ? '' : ` ${cssClass}`,
                '" data-block-type="', name, '" data-block="', id, '">',
                renderChildren(),
            '</div>'].join('');
        },
        createSnapshot: from => {
            return {numColumns: from.numColumns,
                    takeFullWidth: from.takeFullWidth,
                    cssClass: from.cssClass};
        },
        editForm: ColumnsBlockEditForm,
    };
};
