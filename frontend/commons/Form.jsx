import Icon from './Icon.jsx';

const validationStrings = {};

const validatorImplFactories = {
    'required': messages =>
        [(value) => !!value, messages.required]
    ,
    'type': () => {
        throw new Error('Not implemented yet.');
    },
    'minLength': messages =>
        [(value, min) => value.length >= min, messages.minLength]
    ,
    'maxLength': messages =>
        [(value, max) => value.length <= max, messages.maxLength]
    ,
    'min': messages =>
        [(value, min) => value >= min, messages.min]
    ,
    'max': messages =>
        [(value, max) => value <= max, messages.max]
    ,
    'in': () => {
        throw new Error('Not implemented yet.');
    },
    'notIn': messages =>
        [(value, noNos) => noNos.indexOf(value) < 0, messages.notIn]
    ,
    'identifier': () => {
        throw new Error('Not implemented yet.');
    },
    'regexp': (_, args) =>
        [(value, pattern) => (new RegExp(pattern)).test(value),
         `{field}${args.length < 2 ? ' ei kelpaa' : '{arg1}'}`]
    ,
};
const formStateWrappersImpls = new Map;
class Validator {
    /**
     * @param {String} errorLabel
     * @param {Array<[String, ...any]|[[function, String], ...any]>} ruleSettings
     */
    constructor(errorLabel, ruleSettings) {
        this.errorLabel = errorLabel;
        this.ruleImpls = expandRules(ruleSettings);
    }
    /**
     * @param {any} value
     * @returns {String|null}
     * @access public
     */
    checkValidity(value) {
        for (const {ruleImpl, args} of this.ruleImpls) {
            const [validationFn, errorTmpl] = ruleImpl;
            if (!validationFn(value, ...args))
                return this.formatError(errorTmpl, args);
        }
        return null;
    }
    /**
     * @access private
     */
    formatError(errorTmpl, args) {
        return args.reduce((error, arg, i) =>
            error.replace(`{arg${i}}`, arg)
        , errorTmpl.replace('{field}', this.errorLabel));
    }
    /**
     * @param {{[key: String]: String;}} strings
     * @access public
     */
    static setValidationStrings(strings) {
        Object.assign(validationStrings, strings);
    }
    /**
     * @param {String} name
     * @param {new (){pushState: () => String; removeState: () => void; getState: () => {isSubmitting?: Boolean; isValidating?: Boolean; isValid?: Boolean;}; setState: (newState: {isSubmitting?: Boolean; isValidating?: Boolean; isValid?: Boolean;}) => void;}} Cls
     * @access public
     */
    static registerStateWrapperImpl(name, Cls) {
        formStateWrappersImpls.set(name, Cls);
    }
}
class ValidatorRunner {
    /**
     * @param {Object} inputs = {}
     */
    constructor(inputs = {}) {
        this.inputs = new Map;
        for (const name in inputs) {
            const {validations} = inputs[name];
            let validator = null;
            if (validations) {
                if (!Array.isArray(validations) ||
                    !Array.isArray(validations[0]))
                    throw new TypeError('validations must be an array of arrays');
                validator = new Validator(inputs[name].label || name, validations);
            }
            this.setInput(name, validator, inputs[name]);
        }
    }
    /**
     * @param {String} inputName
     * @param {Validator} validator
     * @param {Object} cmp
     * @access public
     */
    setInput(inputName, validator, cmp) {
        this.inputs.set(inputName, {validator, cmp});
    }
    /**
     * @param {String} inputName
     * @returns {{validator: Validator; cmp: Object;}|null}
     * @access public
     */
    getInput(inputName) {
        return this.inputs.get(inputName) || null;
    }
    /**
     * @param {(validator: Validator, inputName: String) => false|any} fn
     */
    each(fn) {
        for (const [inputName, input] of this.inputs) {
            if (fn(input.validator, inputName) === false)
                return false;
        }
        return true;
    }
}
class Form {
    /**
     * @param {preact.Component} vm
     * @param {ValidatorRunner} validatorRunner
     * @param {{getState: () => {isSubmitting?: Boolean; isValidating?: Boolean; isValid?: Boolean;}; setState: (newState: {isSubmitting?: Boolean; isValidating?: Boolean; isValid?: Boolean;}) => void;}} stateWrapper
     */
    constructor(vm, validatorRunner, stateWrapper) {
        this.vm = vm;
        this.validatorRunner = validatorRunner;
        this.stateWrapper = stateWrapper || {
            pushState: () => null,
            removeState: () => null,
            getState: () => ({}),
            setState: () => null
        };
        this.stateWrapper.pushState();
    }
    /**
     * @access public
     */
    destroy() {
        this.stateWrapper.removeState();
    }
    /**
     * @param {InputEvent} e
     * @access public
     */
    handleChange(e) {
        const name = e.target.name;
        const {values, errors, classes} = this.vm.state;
        values[name] = e.target.type !== 'checkbox' ? e.target.value : e.target.checked;
        const prevError = errors[name];
        const input = this.validatorRunner.getInput(name);
        errors[name] = input.validator
            ? input.validator.checkValidity(values[name])
            : '';
        classes[name].invalid = !!errors[name];
        classes[name].focused = true;
        //
        const prevOverall = this.stateWrapper.getState().isValid === true;
        if (errors[name] !== prevError) {
            let overall = !errors[name];
            if (overall) {
                const errors = this.vm.state.errors;
                for (const inputName in errors) {
                    if (inputName !== name && errors[inputName]) { overall = false; break; }
                }
            }
            if (overall !== prevOverall) {
                this.stateWrapper.setState({isValid: overall});
            }
        }
        //
        this.applyState({values, errors, classes}, input.cmp.props.myOnChange);
    }
    /**
     * @param {String} value
     * @param {String} inputName
     * @param {String} inputType 'text'|'checkbox' etc.
     * @access public
     */
    triggerChange(value, inputName, inputType = 'text') {
        this.handleChange({target: {
            name: inputName,
            type: inputType,
            value,
            checked: value,
        }});
    }
    /**
     * @param {InputEvent} e
     * @access public
     */
    handleFocus(e) {
        const classes = this.vm.state.classes;
        classes[e.target.name].focused = true;
        const input = this.validatorRunner.getInput(e.target.name);
        this.applyState({classes}, input.cmp.props.onFocus);
    }
    /**
     * @param {InputEvent} e
     * @access public
     */
    handleBlur(e) {
        if (this.isSubmitting()) return;
        const name = e.target.name;
        const {errors, classes} = this.vm.state;
        const input = this.validatorRunner.getInput(name);
        errors[name] = input.validator
            ? input.validator.checkValidity(this.vm.state.values[name])
            : '';
        classes[name].invalid = !!errors[name];
        classes[name].blurredAtLeastOnce = true;
        classes[name].focused = false;
        classes[e.target.name].focused = true;
        this.applyState({errors, classes}, input.cmp.props.onBlur);
    }
    /**
     * @param {InputEvent} e
     * @access public
     */
    triggerBlur(inputName) {
        this.handleBlur({target: {
            name: inputName,
        }});
    }
    /**
     * @param {InputEvent=} e
     * @param {(state: Object) => Object} myAlterStateFn = null
     * @returns {bool|null} true = valid, false = invalid, null = alreadySubmitting
     * @access public
     */
    handleSubmit(e, myAlterStateFn = null) {
        if (e) e.preventDefault();
        if (this.isValidatingOrSubmitting()) return null;
        this.stateWrapper.setState({isValidating: true});
        const {values, errors, classes} = this.vm.state;
        let overall = true;
        this.validatorRunner.each((validator, inputName) => {
            const error = validator.checkValidity(values[inputName]);
            errors[inputName] = error;
            classes[inputName].invalid = !!error;
            if (overall && error && !classes[inputName].blurredAtLeastOnce)
                classes[inputName].blurredAtLeastOnce = true;
            if (error) overall = false;
        });
        if (overall) {
            this.stateWrapper.setState({isSubmitting: true, isValid: true});
        } else setTimeout(() => {
            this.stateWrapper.setState({isValidating: false, isValid: false});
        }, 800);
        this.applyState({errors, classes}, myAlterStateFn);
        return overall;
    }
    /**
     * @returns {Boolean}
     * @access public
     */
    isValidatingOrSubmitting() {
        const s = this.stateWrapper.getState();
        return s.isValidating || s.isSubmitting;
    }
    /**
     * @returns {Boolean}
     * @access public
     */
    isSubmitting() {
        return this.stateWrapper.getState().isSubmitting === true;
    }
    /**
     * @param {Boolean} isSubmitting
     * @access public
     */
    setIsSubmitting(isSubmitting) {
        this.stateWrapper.setState({isSubmitting});
    }
    /**
     * @access private
     */
    applyState(newState, alterFn) {
        this.vm.setState(!alterFn ? newState : alterFn(newState));
    }
}

/**
 * Usage:
 * ```
 * class MyCmp extends preact.Component {
 *     constructor(props) {
 *         ...
 *         this.state = hookForm(this, {
 *             prop1: 'Some value',
 *             prop2: 'Another',
 *         });
 *     }
 *     render(_, {classes, errors}) {
 *         return <>
 *             <InputGroup classes={ classes.prop1 }>
 *                 <Input vm={ this } name="prop1" id="prop1" errorLabel="prop1 label"
 *                     validations={ [['required'], ['minLength', 8]] } myOnChange={ this.grabChange.bind(this) } className="tight"/>
 *                 <InputError error={ errors.prop1 }/>
 *             </InputGroup>
 *             <InputGroup classes={ classes.prop2 }>
 *                 <Input vm={ this } name="prop2" id="prop2"/>
 *             </InputGroup>
 *         </>;
 *     }
 *     grabChange(newState) {
 *         console.log('Some value changed', newState);
 *         return newState;
 *     }
 * }
 * ```
 * OR
 * ```
 * class MyCmp extends preact.Component {
 *     constructor(props) {
 *         ...
 *         this.state = hookForm(this, null, {
 *             prop1: {value: 'Some value', validations: [['required'], ['minLength', 8]],
 *                     label: 'prop1 label', props: {myOnChange: this.grabChange.bind(this)}},
 *             prop2: {value: 'Another'},
 *         });
 *     }
 *     render(_, {classes, errors, values}) {
 *         return <>
 *             <InputGroup classes={ classes.prop1 }>
 *                 <button onClick={ () => this.form.triggerChange(values.prop1.substr(0, values.prop1.length-1),'prop1') }>Mutate</button>
 *                 { values.prop1 }
 *                 <InputError error={ errors.prop1 }/>
 *             </InputGroup>
 *             <InputGroup classes={ classes.prop2 }>
 *                 <button onClick={ () => this.form.triggerChange('foo', 'prop2') }>Mutate</button>
 *                 { values.prop2 }
 *             </InputGroup>
 *         </>;
 *     }
 *     grabChange(newState) {
 *         console.log('Some value changed', newState);
 *         return newState;
 *     }
 * }
 * ```
 */
const hookForm = (vm, values = null, inputs = null, stateWrapperName = 'default') => {
    if (!values) values = Object.keys(inputs).reduce((out, key) => {
        out[key] = inputs[key].value;
        if (!inputs[key].props) inputs[key].props = {};
        return out;
    }, {});
    const state = {
        values,
        errors: Object.keys(values).reduce((obj, key) =>
            Object.assign(obj, {[key]: null})
        , {}),
        classes: Object.keys(values).reduce((obj, key) =>
            Object.assign(obj, {[key]: {invalid: false,
                                        blurredAtLeastOnce: false,
                                        focused: false}})
        , {}),
    };
    const formStateWrapper = new (formStateWrappersImpls.get(stateWrapperName))();
    Object.assign(vm, {form: new Form(vm, new ValidatorRunner(inputs), formStateWrapper)});
    return state;
};

class AbstractInput extends preact.Component {
    /**
     * @param {{vm: preact.Component; myOnChange?: (state: Object) => Object; validations?: Array<[String, ...any]>; errorLabel?: String; [key: String]: any;}} props
     */
    constructor(props) {
        super(props);
        if (props.type === 'radio')
            throw new Error('type="radio" not supported');
        props.vm.form.validatorRunner.setInput(props.name,
            new Validator((props.errorLabel || props.name) || '<name>',
                          props.validations || []), this);
        this.inputEl = null;
    }
    /**
     * @returns {String} 'input'|'select' etc.
     * @access protected
     */
    getTagName() {
        throw new Error('Abstract method not implemented');
    }
    /**
     * @access protected
     */
    render() {
        const {state, form} = this.props.vm;
        const name = this.props.name;
        const tagName = this.getTagName();
        const inputType = this.props.type || 'text';
        const isSelect = tagName === 'select';
        return preact.createElement(tagName, Object.assign({}, this.props, {
            name,
            className: 'form-input ' +
                        (!this.props.className ? '' : ` ${this.props.className}`) +
                        (!isSelect ? '' : ' form-select'),
            value: state.values[name],
            [!(isSelect ||
               inputType === 'checkbox' ||
               inputType === 'radio') ? 'onInput' : 'onChange']:
                e => form.handleChange(e),
            onFocus: e => form.handleFocus(e),
            onBlur: e => form.handleBlur(e),
            ref: el => { this.inputEl = el; },
        }));
    }
}

class Input extends AbstractInput {
    getTagName() { return 'input'; }
}

class Textarea extends AbstractInput {
    getTagName() { return 'textarea'; }
}

class Select extends AbstractInput {
    getTagName() { return 'select'; }
}

/**
 * @param {{invalid: Boolean; focused: Boolean; blurredAtLeastOnce: Boolean;}}
 * @returns {String}
 */
function formatCssClasses(classes) {
    return (classes.invalid ? ' has-error' : '') +
            (classes.focused ? ' focused' : '') +
            (classes.blurredAtLeastOnce ? ' blurred-at-least-once' : '');
}

class InputGroup extends preact.Component {
    /**
     * @param {{classes?: {invalid: Boolean; focused: Boolean; blurredAtLeastOnce: Boolean;}; className?: String;}} props
     * @access protected
     */
    render({children, classes, className}) {
        return <div
            className={ 'form-group' +
                        (!className ? '' : ` ${className}`) +
                        (classes ? formatCssClasses(classes) : '') }>
            { children }
        </div>;
    }
}

class InputError extends preact.Component {
    /**
     * @param {{error?: String; className?: String;}} props
     * @access protected
     */
    render({error, className}) {
        return !error ? null : <div class={ 'form-input-hint' + (!className ? '' : ` ${className}`) }>{ error }</div>;
    }
}

class FormButtons extends preact.Component {
    /**
     * @param {{buttons?: Array<'submit'|'submitWithAlt'|'cancel'|preact.AnyComponent>; submitButtonText?: String; altSubmitButtonText?: String; cancelButtonText?: String; returnTo?: String; className?: String;}} props
     */
    constructor(props) {
        super(props);
        this.state = {altMenuIsOpen: false};
    }
    /**
     * @access protected
     */
    render(props) {
        return <div class={ `form-buttons${!props.className ? '' : ` ${props.className}`}` }>
            { (props.buttons || ['submit', 'cancel']).map(candidate => {
                if (candidate === 'submit')
                    return <button class="btn btn-primary" type="submit">
                        { props.submitButtonText || 'Ok' }
                    </button>;
                if (candidate === 'submitWithAlt')
                    return <div class={ `btn-group p-relative${!this.state.altMenuIsOpen ? '' : ' open'}` }>
                        <button class="btn btn-primary" type="submit">
                            { props.submitButtonText || 'Ok' }
                        </button>
                        <button
                            onClick={ () => this.setState({altMenuIsOpen: !this.state.altMenuIsOpen}) }
                            class="btn btn-primary"
                            type="button">
                            <Icon iconId="chevron-down" className="size-xs"/>
                        </button>
                        <a href="#close" onClick={ e => this.closeAltMenu(e) } class="close-overlay"></a>
                        <ul class="popup-menu menu">
                            <li class="menu-item"><a onClick={ e => this.triggerOnSubmit(e) } href="">{ props.altSubmitButtonText || 'Alt' }</a></li>
                        </ul>
                    </div>;
                if (candidate === 'cancel')
                    return <a
                        href={ `#${props.returnTo || '/'}` }
                        onClick={ e => this.handleCancel(e) }
                        class="ml-2">
                        { props.cancelButtonText || 'Peruuta' }
                    </a>;
                return candidate;
            }) }
        </div>;
    }
    /**
     * @access protected
     */
    handleCancel(e) {
        if (this.props.onCancel) this.props.onCancel(e);
    }
    /**
     * @access private
     */
    triggerOnSubmit(e) {
        this.closeAltMenu(e);
        const form = e.target.closest('form');
        if (!form) throw new Error('Expected <FormButtons/> to be a child of <form>');
        const myEvent = new Event('submit', {'bubbles': true, 'cancelable': true});
        myEvent.altSubmitLinkIndex = 0;
        form.dispatchEvent(myEvent);
    }
    /**
     * @access private
     */
    closeAltMenu(e) {
        e.preventDefault();
        this.setState({altMenuIsOpen: false});
    }
}

function expandRules(rules) {
    return rules.map(([ruleNameOrCustomImpl, ...args]) => {
        // ['ruleName', ...args]
        if (typeof ruleNameOrCustomImpl === 'string') {
            const ruleImpl = validatorImplFactories[ruleNameOrCustomImpl](validationStrings, args);
            if (!ruleImpl)
                throw new Error(`Rule ${ruleNameOrCustomImpl} not implemented`);
            return {ruleImpl, args};
        }
        // [[<customFn>, <errorTmpl>], ...args]
        if (typeof ruleNameOrCustomImpl[0] !== 'function' ||
            typeof ruleNameOrCustomImpl[1] !== 'string')
            throw new Error('One-time-rule must be [myCheckFn, \'Error template\']');
        return {ruleImpl: ruleNameOrCustomImpl, args};
    });
}

export {hookForm, InputGroup, Input, Textarea, Select, InputError, FormButtons, Validator};
