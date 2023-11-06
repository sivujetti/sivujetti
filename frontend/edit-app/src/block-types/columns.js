import {__, http, env, hookForm, unhookForm, reHookValues, Input, InputErrors, FormGroupInline} from '@sivujetti-commons-for-edit-app';
import setFocusTo from './auto-focusers.js';

class ColumnsBlockEditForm extends preact.Component {
    // numColumnsEl;
    /**
     * @access protected
     */
    componentWillMount() {
        this.numColumnsEl = preact.createRef();
        const {getBlockCopy, emitValueChanged, grabChanges} = this.props;
        const {numColumns, takeFullWidth} = getBlockCopy();
        this.setState(hookForm(this, [
            {name: 'numColumns', value: numColumns, validations: [['min', 0], ['max', 12]],
             label: __('Num columns'), type: 'number', step: '1', onAfterValueChanged: (value, hasErrors) => {
                 emitValueChanged(value, 'numColumns', hasErrors, env.normalTypingDebounceMillis); }},
        ], {
            takeFullWidth: takeFullWidth,
        }));
        grabChanges((block, _origin, isUndo) => {
            if (isUndo && this.state.values.numColumns !== block.numColumns)
                reHookValues(this, [{name: 'numColumns', value: block.numColumns}]);
            if (this.state.takeFullWidth !== block.takeFullWidth)
                this.setState({takeFullWidth: block.takeFullWidth});
        });
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

export default () => {
    const initialData = {
        numColumns: 2,
        takeFullWidth: 1,
    };
    const name = 'Columns';
    return {
        name,
        friendlyName: 'Columns',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-generic-wrapper',
        icon: 'layout-columns',
        reRender(block, renderChildren, shouldBackendRender) {
            if (shouldBackendRender)
                return http.post('/api/blocks/render', {block}).then(resp => resp.result);
            const {numColumns, takeFullWidth, styleClasses, id} = block;
            return ['<div class="j-', name, ' num-cols-', parseInt(numColumns),
                takeFullWidth ? '' : ' inline',
                !styleClasses ? '' : ` ${styleClasses}`,
                '" data-block-type="', name, '" data-block="', id, '">',
                renderChildren(),
            '</div>'].join('');
        },
        createSnapshot: from => {
            return {numColumns: from.numColumns,
                    takeFullWidth: from.takeFullWidth};
        },
        editForm: ColumnsBlockEditForm,
    };
};
