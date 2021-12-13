import {__} from '../commons/main.js';
import {useField, FormGroupInline, InputErrors} from '../commons/Form2.jsx';
import {formValidation} from '../constants.js';

/**
 * @type {preact.FunctionalComponent<BlockEditFormProps2>}
 */
const ColumnsBlockEditForm = ({block, funcsIn, funcsOut}) => {
    const numColumns = useField('numColumns', {value: block.numColumns, validations: [['min', 0], ['max', 12]],
        label: __('Num columns'), type: 'number', step: '1',
        onAfterValidation: (val, hasErrors) => { funcsIn.onValueChanged(val, 'numColumns', hasErrors); }});
    const cssClass = useField('cssClass', {value: block.cssClass, validations: [['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]],
        label: __('Css classes'),
        onAfterValidation: (val, hasErrors) => { funcsIn.onValueChanged(val, 'cssClass', hasErrors); }});
    const [takeFullWidth, setTakeFullWidth] = preactHooks.useState(block.takeFullWidth);
    const emitSetFullWidth = preactHooks.useCallback(e => {
        const newVal = e.target.checked ? 1 : 0;
        setTakeFullWidth(newVal);
        funcsIn.onValueChanged(newVal, 'takeFullWidth');
    }, [takeFullWidth]);
    //
    funcsOut.resetValues = preactHooks.useCallback((newData) => {
        numColumns.onInput({target: {value: newData.numColumns}});
        cssClass.onInput({target: {value: newData.cssClass}});
        setTakeFullWidth(newData.takeFullWidth);
    });
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
                    onClick={ emitSetFullWidth }
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
        createSnapshot: from => {
            return {numColumns: from.numColumns,
                    takeFullWidth: from.takeFullWidth,
                    cssClass: from.cssClass};
        },
        editForm: ColumnsBlockEditForm,
    };
};
