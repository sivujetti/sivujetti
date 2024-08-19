import {
    __,
    CrudList,
    FormGroupInline,
    hasErrors,
    hookForm,
    Icon,
    Input,
    InputErrors,
    objectUtils,
    reHookValues,
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
                cssSubSelector: null,
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


////////////////////////////////////////////////////////////////////////////////


/** @extends {preact.Component<EditConfigSettingsFormProps, any>} */
class EditConfigSettingsForm extends preact.Component {
    // nameInputRef;
    /**
     * @access protected
     */
    componentWillMount() {
        this.nameInputRef = preact.createRef();
        const {cssProp, cssSubSelector, widgetSettings} = this.props.item;
        const widgetType = widgetSettings.valueType;
        this.setState(hookForm(this, [
            {name: 'name', value: widgetSettings.label, validations: [
                ['required'], ['maxLength', 128]
            ], label: __('Name')},
            {name: 'cssProp', value: cssProp, validations: [
                ['required'], ['maxLength', 128], ['regexp', '^[-a-z]*$']
            ], label: 'CSS prop'},
            {name: 'subSelector', value: cssSubSelector || '', validations: [
                ['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]
            ], label: 'Sub selector'},
            {name: 'defaultThemeValue', value: widgetSettings.defaultThemeValue || '', validations: [
                ['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]
            ], label: __('Default value')},
            {name: 'initialUnit', value: widgetSettings.initialUnit || '', validations: [
                ['maxLength', 32]
            ], label: __('Initial unit')},
        ], {
            widgetType,
            ...(widgetType !== 'option' ? {} : {optionWidgetOptions: [...widgetSettings.options]}),
        }));
    }
    /**
     * @access protected
     */
    componentDidMount() {
        setFocusTo(this.nameInputRef);
    }
    /**
     * @access protected
     */
    render({widgetNamesTranslated}, {widgetType}) {
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
                <div>
                    <select
                        onChange={ this.handleWidgetTypeChanged.bind(this) }
                        value={ widgetType }
                        class="form-select"
                        name="varType">
                        { Object.keys(widgetNamesTranslated).map(name =>
                            <option value={ name }>{ widgetNamesTranslated[name] }</option>
                        ) }
                    </select>
                    { widgetType !== 'option' ? null : <CrudList
                        items={ this.state.optionWidgetOptions }
                        itemTitleKey="label"
                        getTitle={ item => [`${item.label} `, <i class="color-dimmed">({item.value})</i>] }
                        onListMutated={ reOrdered => this.setState({optionWidgetOptions: reOrdered}) }
                        createNewItem={ () => ({label: 'Choice n', value: 'choice-n'}) }
                        editForm={ OptionWidgetOptionEditForm }
                        editFormProps={ {} }
                        itemTypeFriendlyName={ __('option') }
                        contextMenuZIndex={ 102 }/> }
                </div>
            </FormGroupInline>
            <FormGroupInline className="my-1 mx-0">
                <label htmlFor="varDefaultValue" class="form-label" placeholder={ __('Examples: 1rem, flex-end') }>{ __('Default value') }</label>
                <Input vm={ this } prop="defaultThemeValue" id="varDefaultValue"/>
                <InputErrors vm={ this } prop="defaultThemeValue"/>
            </FormGroupInline>
            { widgetType !== 'length' ? null : <FormGroupInline className="my-1 mx-0">
                <label htmlFor="varInitialUnit" class="form-label" placeholder={ __('Examples: px, %') }>{ __('Initial unit') }</label>
                <Input vm={ this } prop="initialUnit" id="varInitialUnit"/>
                <InputErrors vm={ this } prop="initialUnit"/>
            </FormGroupInline> }
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
    handleWidgetTypeChanged(e) {
        const newVal = e.target.value;
        reHookValues(this, [
            {name: 'initialUnit', value: ''},
            {name: 'defaultThemeValue', value: ''},
        ], {
            widgetType: newVal,
            ...(newVal !== 'option'
                ? {}
                : {
                    optionWidgetOptions: [
                        {label: 'Choice 1', value: 'choice-1'},
                        {label: 'Choice 2', value: 'choice-2'},
                    ],
                }),
        });
    }
    /**
     * @param {Event} e
     * @access private
     */
    doHandleSubmit(e) {
        e.preventDefault();
        if (!validateAll(this))
            return false;
        const {values, optionWidgetOptions, widgetType} = this.state;
        this.props.onEditEnded({
            cssProp: values.cssProp,
            cssSubSelector: values.subSelector || null,
            widgetSettings: {
                label: values.name,
                inputId: this.props.item.widgetSettings.inputId,
                valueType: widgetType,
                ...(values.defaultThemeValue ? {defaultThemeValue: values.defaultThemeValue} : {}),
                ...(optionWidgetOptions ? {options: optionWidgetOptions} : {}),
                ...(values.initialUnit ? {initialUnit: values.initialUnit} : {}),
            },
        });
    }
}


////////////////////////////////////////////////////////////////////////////////


class OptionWidgetOptionEditForm extends preact.Component {
    /**
     * @param {{item: OptionWidgetOption; onValueChanged: (value: string, key: keyof OptionWidgetOption) => void; done: () => void;}} props
     */
    constructor(props) {
        super(props);
        this.state = hookForm(this, [
            {name: 'label', value: props.item.label, validations: [['minLength', 1]], label: __('Option text'),
             onAfterValueChanged: (value, hasErrors, _source) => {
                if (!hasErrors) this.props.onValueChanged(value, 'label');
            }},
            {name: 'value', value: props.item.value, validations: [['minLength', 1]], label: __('Option value'),
             onAfterValueChanged: (value, hasErrors, _source) => {
                if (!hasErrors) this.props.onValueChanged(value, 'value');
            }},
        ]);
    }
    /**
     * @param {OptionWidgetOption} item
     * @access public
     */
    overrideValues(item) {
        reHookValues(this, [
            {name: 'label', value: item.label},
            {name: 'value', value: item.value},
        ]);
    }
    /**
     * @access protected
     */
    render({done}) {
        return <div class="form-horizontal">
            <button
                onClick={ () => done() }
                class="btn btn-sm"
                disabled={ hasErrors(this) }
                title={ __('Done') }
                type="button">&lt;</button>
            <FormGroupInline className="mt-0 mb-2">
                <label htmlFor="optionItemText" class="form-label">{ __('Option text') }</label>
                <Textarea vm={ this } prop="label" id="optionItemText" rows="3"/>
                <InputErrors vm={ this } prop="label"/>
            </FormGroupInline>
            <FormGroupInline className="my-0">
                <label htmlFor="selectOrRadioItemValue" class="form-label">{ __('Option value') }</label>
                <Textarea vm={ this } prop="value" id="selectOrRadioItemValue" rows="3"/>
                <InputErrors vm={ this } prop="value"/>
            </FormGroupInline>
        </div>;
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
 *
 * @typedef {{label: string; value: string;}} OptionWidgetOption
 */

export default CustomClassStyleEditCustomizationsDialog;
