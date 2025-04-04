import {
    __,
    FormGroupInline,
    hasErrors,
    hookForm,
    Icon,
    InputErrors,
    reHookValues,
    Textarea,
} from '@sivujetti-commons-for-edit-app';
import {createSaveButtonUndoHotkeyDisabler} from '../CustomClassStyleEditCustomizationsDialog.jsx';

/** @extends {preact.Component<EditOptionFormProps, any>} */
class EditOptionForm extends preact.Component {
    /**
     * @param {EditOptionFormProps} props
     */
    constructor(props) {
        super(props);
        this.disableGlobalUndoHotkeys = createSaveButtonUndoHotkeyDisabler();
        this.state = hookForm(this, [
            {name: 'name', value: props.item.name, validations: [['minLength', 1], ['maxLength', 191]], label: __('Name'),
             onAfterValueChanged: (value, hasErrors, _source) => {
                if (!hasErrors) this.props.onValueChanged(value, 'name');
            }},
            {name: 'cssClass', value: props.item.cssClass, validations: [['minLength', 1], ['regexp', '^[\\p{L}\\p{N}_-]+$', 'u']], label: __('CSS class'),
             onAfterValueChanged: (value, hasErrors, _source) => {
                if (!hasErrors) this.props.onValueChanged(value, 'cssClass');
            }},
        ]);
    }
    /**
     * @param {WysiwygMiscStyleOption} item
     * @access public
     */
    overrideValues(item) {
        reHookValues(this, [
            {name: 'name', value: item.name},
            {name: 'cssClass', value: item.cssClass},
        ]);
    }
    /**
     * @access protected
     */
    componentDidMount() {
        this.props.updateDialogHeight();
    }
    /**
     * @access protected
     */
    render({done}) {
        return <div class="form-horizontal pb-0">
            <button
                onClick={ () => {
                    done();
                    this.props.updateDialogHeight();
                } }
                class="btn btn-sm"
                disabled={ hasErrors(this) }
                title={ __('Done') }
                type="button">&lt;</button>
            <FormGroupInline className="mt-0 mb-2">
                <label htmlFor="optionItemText" class="form-label">
                    { __('Name') }
                    <span class="tooltip tooltip-right p-absolute mt-1 ml-1" data-tooltip={ __('Style selection name visible in the Quill editor') }>
                        <Icon iconId="info-circle" className="color-dimmed3 size-xs"/>
                    </span>
                </label>
                <Textarea vm={ this } prop="name" id="optionItemText" rows="3" { ...this.disableGlobalUndoHotkeys }/>
                <InputErrors vm={ this } prop="name"/>
            </FormGroupInline>
            <FormGroupInline>
                <label htmlFor="optionCssClass" class="form-label">
                    { __('CSS class') }
                    <span class="tooltip tooltip-right p-absolute mt-1 ml-1" data-tooltip={ __('CSS class applied to the formatted text') }>
                        <Icon iconId="info-circle" className="color-dimmed3 size-xs"/>
                    </span>
                </label>
                <Textarea vm={ this } prop="cssClass" id="optionCssClass" rows="3" { ...this.disableGlobalUndoHotkeys }/>
                <InputErrors vm={ this } prop="cssClass"/>
            </FormGroupInline>
        </div>;
    }
}

/**
 * @typedef {{
 *   item: WysiwygMiscStyleOption;
 *   onValueChanged: (value: string, key: keyof WysiwygMiscStyleOption) => void;
 *   done: () => void;
 *   updateDialogHeight(): void;
 * }} EditOptionFormProps
 */

export default EditOptionForm;
