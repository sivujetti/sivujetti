import {__, env} from '../commons/main.js';
import {useField, useValidations, FormGroupInline, InputErrors} from '../commons/Form2.jsx';
import {formValidation} from '../constants.js';

/**
 * @type {preact.FunctionalComponent<BlockEditFormProps>}
 */
const ColumnsBlockEditForm = ({block, onValueChanged}) => {
    const numColumns = useField('numColumns', {value: block.numColumns, validations: [['min', 1], ['max', 12]], label: __('Num columns'), type: 'number', step: '1'});
    const cssClass = useField('cssClass', {value: block.cssClass, validations: [['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]], label: __('Css classes')});
    const form = useValidations([numColumns, cssClass]);
    const [takeFullWidth, setTakeFullWidth] = preactHooks.useState(block.takeFullWidth);
    //
    preactHooks.useEffect(() => {
        if (!form.initialized) return;
        onValueChanged({numColumns: numColumns.value,
                        takeFullWidth,
                        cssClass: cssClass.value},
                        env.normalTypingDebounceMillis);
    }, [numColumns.value, takeFullWidth, cssClass.value]);
    //
    return <div class="form-horizontal pt-0">
        <FormGroupInline>
            <label htmlFor="numColumns" class="form-label">{ __('Num columns') }</label>
            <input { ...numColumns }/>
            <InputErrors errors={ numColumns.getErrors() }/>
        </FormGroupInline>
        <FormGroupInline>
            <span class="form-label">{ __('Full width') }</span>
            <label class="form-checkbox mt-0">
                <input
                    onClick={ e => setTakeFullWidth(e.target.checked ? 1 : 0) }
                    checked={ takeFullWidth }
                    type="checkbox"
                    id="fullWidth"
                    class="form-input"/><i class="form-icon"></i>
            </label>
        </FormGroupInline>
        <FormGroupInline>
            <label htmlFor="cssClass" class="form-label">{ __('Css classes') }</label>
            <input { ...cssClass }/>
            <InputErrors errors={ cssClass.getErrors() }/>
        </FormGroupInline>
    </div>;
};

export default () => {
    const initialData = {
        numColumns: 2,
        takeFullWidth: 1,
        cssClass: ''
    };
    return {
        name: 'Columns',
        friendlyName: 'Columns',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-generic-wrapper',
        reRender({numColumns, takeFullWidth, cssClass}, renderChildren) {
            return ['<div class="jet-columns num-cols-', Math.floor(numColumns),
                takeFullWidth ? '' : ' inline',
                !cssClass ? '' : ` ${cssClass}`,
                '">',
                renderChildren(),
            '</div>'].join('');
        },
        editForm: ColumnsBlockEditForm,
    };
};
