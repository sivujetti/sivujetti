import {
    __,
    FormGroupInline,
    hasErrors,
    hookForm,
    Icon,
    Input,
    InputErrors,
    objectUtils,
    setFocusTo,
    Textarea,
    validateAll,
    validationConstraints,
} from '@sivujetti-commons-for-edit-app';

/** @extends {preact.Component<CustomClassStyleEditCustomizationsDialogProps, any>} */
class CustomClassStyleEditCustomizationsDialog extends preact.Component {
    // widgetNamesTranslated;
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState({varDefs: createVarDefsState(this.props), idxOfItemInEditMode: null});
        this.widgetNamesTranslated = {
            length: __('Length'),
            color: __('Color'),
            option: __('Option'),
            backgroundImage: __('Background image'),
        };
    }
    /**
     * @param {CustomClassStyleEditCustomizationsDialogProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (JSON.stringify(props.currentSettings) !== JSON.stringify(this.props.currentSettings))
            this.setState({varDefs: createVarDefsState(props)});
    }
    /**
     * @access protected
     */
    render(_, {varDefs, idxOfItemInEditMode}) {
        return <div>
            <div class="text-prose mb-2">{ __('...') }</div>
            <ul class="list styles-list style-tweak-settings-list mb-2 color-dimmed">{ varDefs.map((v, i) =>
                <li class="mt-1">{ i !== idxOfItemInEditMode
                    ? [<b>{ v.widgetSettings.label }</b>,
                    <div class="text-tinyish mt-1" style="color: var(--color-fg-dimmed2)">
                        <div>{ __('Type') }: { this.widgetNamesTranslated[v.widgetSettings.valueType] || v.widgetSettings.valueType }</div>
                        <div>CSS prop: <span>{ v.cssProp }</span></div>
                    </div>,
                    <button
                        onClick={ () => this.setToEditMode(i) }
                        class="btn btn-xs no-color flex-centered"
                        type="button"
                        disabled={ idxOfItemInEditMode !== null }>
                        <Icon iconId="pencil" className="size-xs color-dimmed"/>
                    </button>,
                    <button
                        onClick={ () => this.removeVariable(i) }
                        class="btn btn-xs no-color flex-centered"
                        type="button"
                        disabled={ idxOfItemInEditMode !== null }>
                        <svg class="icon icon-tabler size-xs color-dimmed" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M10 11l0 6"></path><path d="M14 11l0 6"></path><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path></svg>
                    </button>
                    ]
                    : <EditConfigSettingsForm
                        item={ varDefs[idxOfItemInEditMode] }
                        onEditEnded={ this.handleEditEnded.bind(this) }
                        widgetNamesTranslated={ this.widgetNamesTranslated }/>
                }</li>
            ) }</ul>
            <button
                onClick={ this.appendVariable.bind(this) }
                class="btn btn-primary btn-sm"
                type="button"
                disabled={ idxOfItemInEditMode !== null }>{ __('Add variable') }</button>
        </div>;
    }
    /**
     * @access private
     */
    appendVariable() {
        this.setState({
            varDefs: [...this.state.varDefs, {
                varName: '@pending',
                cssProp: '',
                cssSubSelector: '',
                widgetSettings: {
                    valueType: 'length',
                    label: '',
                    inputId: '@pending',
                }
            }],
            idxOfItemInEditMode: this.state.varDefs.length,
        });
    }
    /**
     * @param {number|null} idx
     * @access private
     */
    setToEditMode(idx) {
        this.setState({idxOfItemInEditMode: idx});
    }
    /**
     * @param {{cssProp: string; cssSubSelector: string|null; widgetSettings: {valueType: string; label: string; inputId: string;};}} newVarDefData
     * @access private
     */
    handleEditEnded(newVarDefData) {
        if (newVarDefData) {
            const idx = this.state.idxOfItemInEditMode;
            const updated = this.state.varDefs.map((v, i) => i !== idx ? v : {...v, ...newVarDefData});
            this.props.onSettingsChanged(updated);
        } else if (this.state.varDefs.at(-1).varName === '@pending') { // Cancel was pressed + new item
            this.setState({varDefs: this.state.varDefs.slice(0, this.state.varDefs.length - 1)});
        }
        this.setToEditMode(null);
    }
    /**
     * @param {number} idx
     * @access private
     */
    removeVariable(idx) {
        const filtered = this.state.varDefs.filter((_, i) => i !== idx);
        this.props.onSettingsChanged(filtered);
    }
}

/**
 * @param {CustomClassStyleEditCustomizationsDialogProps} props
 */
function createVarDefsState({currentSettings}) {
    return currentSettings ? objectUtils.cloneDeep(currentSettings) : [];
}

/** @extends {preact.Component<EditConfigSettingsFormProps, any>} */
class EditConfigSettingsForm extends preact.Component {
    // nameInputRef;
    /**
     * @access protected
     */
    componentWillMount() {
        this.nameInputRef = preact.createRef();
        const {cssProp, cssSubSelector, widgetSettings} = this.props.item;
        this.setState(hookForm(this, [
            {name: 'name', value: widgetSettings.label, validations: [
                ['required'], ['maxLength', 128]
            ], label: __('Name')},
            {name: 'cssProp', value: cssProp, validations: [
                ['required'], ['maxLength', 128], ['regexp', '^[-a-z]*$']
            ], label: 'CSS prop'},
            {name: 'subSelector', value: cssSubSelector, validations: [
                ['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]
            ], label: 'Sub selector'},
        ], {
            widgetSettings: objectUtils.cloneDeep(widgetSettings)
        }));
    }
    /**
     * @access protected
     */
    componentDidMount() {
        setFocusTo(this.nameInputRef);
    }
    render({widgetNamesTranslated}, {widgetSettings}) {
        return <form onSubmit={ this.doHandleSubmit.bind(this) } class="form-horizontal text-tinyish py-0">
            <FormGroupInline className="my-1 mx-0">
                <label htmlFor="varName" class="form-label" placeholder={ __('Examples: Font size, Background color') }>{ __('Name') }</label>
                <Input vm={ this } prop="name" id="varName" ref={ this.nameInputRef }/>
                <InputErrors vm={ this } prop="name"/>
            </FormGroupInline>
            <FormGroupInline className="my-1 mx-0">
                <label htmlFor="varCssProp" class="form-label">CSS prop</label>
                <Textarea
                    vm={ this }
                    prop="cssProp" id="varCssProp"
                    placeholder={ `${__('Examples:')} font-size, background-color` }
                    rows="1"/>
                <InputErrors vm={ this } prop="cssProp"/>
            </FormGroupInline>
            <FormGroupInline className="my-1 mx-0">
                <label htmlFor="varSubSelector" class="form-label">Sub selector</label>
                <Input vm={ this } prop="subSelector" id="varSubSelector" placeholder={ `${__('Examples:')} img, > div` }/>
                <InputErrors vm={ this } prop="subSelector"/>
            </FormGroupInline>
            <FormGroupInline className="my-1 mx-0">
                <label class="form-label">{ __('Type') }</label>
                <select
                    onChange={ () => {} }
                    value={ widgetSettings.valueType }
                    class="form-select"
                    name="varType"
                    disabled>
                    { Object.keys(widgetNamesTranslated).map(name =>
                        <option value={ name }>{ widgetNamesTranslated[name] }</option>
                    ) }
                </select>
            </FormGroupInline>
            <button
                class="btn btn-sm px-2"
                type="submit"
                disabled={ hasErrors(this) }>Ok</button>
            <button
                onClick={ () => this.props.onEditEnded(null) }
                class="btn btn-sm btn-link ml-1"
                type="button">{ __('Cancel') }</button>
        </form>;
    }
    /**
     * @param {Event} e
     * @access private
     */
    doHandleSubmit(e) {
        e.preventDefault();
        if (!validateAll(this))
            return false;
        const {values, widgetSettings} = this.state;
        this.props.onEditEnded({
            cssProp: values.cssProp,
            cssSubSelector: values.subSelector || null,
            widgetSettings: {
                ...widgetSettings,
                label: values.label,
            },
        });
    }
}

/**
 * @typedef {{
 *   currentSettings: Array<VisualStylesFormVarDefinition>;
 *   onSettingsChanged: (newSettings: Array<VisualStylesFormVarDefinition>) => void;
 * }} CustomClassStyleEditCustomizationsDialogProps
 *
 * @typedef {{
 *   item: VisualStylesFormVarDefinition;
 *   onEditEnded: (what: todo) => void;
 *   widgetNamesTranslated: {[name: string]: string;};
 * }} EditConfigSettingsFormProps
 */

export default CustomClassStyleEditCustomizationsDialog;
