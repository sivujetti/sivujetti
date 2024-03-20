import {env} from '@sivujetti-commons-for-web-pages';
import {__} from './edit-app-singletons.js';

const validatorImplFactories = {
    'required':   () => ({doValidate: value => !!value, errorMessageTmpl: __('required')}),
    'minLength':  () => ({doValidate: (value, min) => value.length >= min, errorMessageTmpl: __('minLength')}),
    'maxLength':  () => ({doValidate: (value, max) => value.length <= max, errorMessageTmpl: __('maxLength')}),
    'min':        () => ({doValidate: (value, min) => value >= min, errorMessageTmpl: __('min')}),
    'max':        () => ({doValidate: (value, max) => value <= max, errorMessageTmpl: __('max')}),
    'identifier': () => ({doValidate: value => /^[a-zA-Z_]{1}\w*$/.test(value), errorMessageTmpl: __('identifier')}),
    'regexp':     () => ({doValidate: (value, pattern) => (new RegExp(pattern)).test(value), errorMessageTmpl: __('regexp')}),
};

/**
 * @param {String} errorTmpl
 * @param {String|undefined} label
 * @param {Array} args
 * @returns {String}
 */
const formatError = (errorTmpl, label, args) => {
    const errorLabel = label || __('This field');
    return args.reduce((error, arg, i) =>
        error.replace(`{arg${i}}`, arg)
    , errorTmpl.replace('{field}', errorLabel));
};

/**
 * @param {preact.Component} cmp
 * @param {Array<InputDef>} inps
 * @param {{[key: String]: any;}} initialState = {}
 * @returns {{[key: String]: any;}}
 */
function hookForm(cmp, inps, initialState = {}) {
    const values = {};
    const errors = {};
    const blurStates = {};
    const inputApis = {};
    inps.forEach(inp => {
        const k = mkKey(inp);
        if (!inp.valueType)
            inp.valueType = typeof inp.value === 'number' ? 'int' : null;
        values[k] = inp.value;
        errors[k] = [];
        blurStates[k] = false;
        inputApis[k] = createApi(cmp, k, inp);
    });
    cmp.inputApis = inputApis;
    const overallFormState = {formIsSubmitting: false,
                              formIsSubmittingClass: ''};
    return Object.assign(initialState, {values, errors, blurStates}, overallFormState);
}

/**
 * @param {preact.Component} cmp
 * @param {() => Promise<any>} fn
 * @param {Event=} e = null
 */
function handleSubmit(cmp, fn, e = null) {
    if (e) e.preventDefault();
    if (cmp.state.formIsSubmitting)
        return null;
    if (!validateAll(cmp))
        return false;
    cmp.setState({formIsSubmitting: true,
                  formIsSubmittingClass: ' loading'});
    fn()
        .then(() => {
            //
        })
        .catch(env.window.console.error)
        .finally(() => {
            cmp.setState({formIsSubmitting: false,
                          formIsSubmittingClass: ''});
        });
    return true;
}

/**
 * @param {preact.Component} cmp
 */
function unhookForm(cmp) {
    cmp.formIsHooked = false;
}

/**
 * @param {preact.Component} cmp
 * @param {String} k
 * @param {InputDef} inp
 * @returns {todo2}
 */
function createApi(cmp, k, inp) {
    const out = {};
    out.name = inp.name;
    out.type = inp.type || 'text';
    out.className = inp.className || 'form-input';
    out.doValidate = value =>
        (inp.validations || []).reduce((errors, [validatorName, ...args]) => {
            const {doValidate, errorMessageTmpl} = typeof validatorName === 'string' ? validatorImplFactories[validatorName]() : validatorName;
            const isValid = doValidate(value !== undefined ? value : '', ...args);
            if (!isValid)
                return errors.concat({type: validatorName, message: formatError(errorMessageTmpl, inp.label, args)});
            else
                return errors;
        }, [])
    ;
    out.triggerInput = (value, source = 'default', newState = {}) => {
        const errors = out.doValidate(value);
        newState.values = Object.assign({}, cmp.state.values, {[k]: value});
        newState.errors = Object.assign({}, cmp.state.errors, {[k]: errors});
        cmp.setState(newState);
        cmp.state.values = newState.values;
        if (inp.onAfterValueChanged) inp.onAfterValueChanged(value, errors.length, source);
    };
    out.onInput = e => {
        out.triggerInput(getFormattedValue(inp, e.target.value));
    };
    out.onBlur = e => {
        if (!e) return;
        setTimeout(() => {
            if (cmp.formIsHooked === false)
                return;
            const newState = {};
            if (!cmp.state.blurStates[k])
                newState.blurStates = Object.assign({}, cmp.state.blurStates, {[k]: true});
            const val = getFormattedValue(inp, e.target.value);
            if (val === cmp.state.values[k])
                cmp.setState(newState);
            else out.triggerInput(val, undefined, newState);
        }, 100);
    };
    return out;
}

/**
 * @param {preact.Component} cmp
 * @returns {Boolean}
 */
function validateAll(cmp) {
    const inputApis = cmp.inputApis;
    let numErrors = 0;
    const newErrors = Object.assign({}, cmp.state.errors);
    for (const k in inputApis) {
        const errors = inputApis[k].doValidate(cmp.state.values[k]);
        if (errors && !numErrors) {
            newErrors[k] = errors;
        }
        numErrors += errors.length;
    }
    cmp.setState({errors: newErrors});
    return numErrors === 0;
}

/**
 * @param {preact.Component} cmp
 * @returns {Boolean}
 */
function hasErrors(cmp) {
    const errs = cmp.state.errors;
    for (const k in errs) {
        if (errs[k].length) return true;
    }
    return false;
}

/**
 * @param {preact.Component} cmp
 * @param {Array<InputDef>} inps
 */
function reHookValues(cmp, inps) {
    const newState = {values: Object.assign({}, cmp.state.values),
                      errors: Object.assign({}, cmp.state.errors)};
    inps.forEach(inp => {
        const k = mkKey(inp);
        const out2 = cmp.inputApis[k];
        if (!out2) throw new Error(`No such input "${k}"`);
        const errors = out2.doValidate(inp.value);
        newState.values[k] = inp.value;
        newState.errors[k] = errors;
    });
    cmp.setState(newState);
}

/**
 * @param {InputDef} inp
 * @returns {String}
 */
function mkKey(inp) {
    return inp.id || inp.name; // todo sanity check tai throw
}

/**
 * @param {InputDef} inp
 * @param {String|Number} value = inp.value
 * @returns {String|Number}
 */
function getFormattedValue(inp, value = inp.value) {
    return inp.valueType !== 'int' ? value : parseInt(value, 10);
}

class Input extends preact.Component {
    // inputEl;
    /**
     * @param {{vm: preact.Component; prop: String;}} props
     */
    constructor(props) {
        super(props);
        this.inputEl = preact.createRef();
    }
    /**
     * @access protected
     */
    render(props) {
        const {vm, prop} = props;
        return <input
            { ...vm.inputApis[prop] }
            { ...props }
            value={ vm.state.values[prop] }
            ref={ this.inputEl }/>;
    }
}

class Textarea extends Input {
    /**
     * @access protected
     */
    render(props) {
        const {vm, prop} = props;
        return <textarea
            { ...vm.inputApis[prop] }
            { ...props }
            value={ vm.state.values[prop] }
            ref={ this.inputEl }></textarea>;
    }
}

class InputError extends preact.Component {
    /**
     * @param {{errorMessage?: String;}} props
     * @access protected
     */
    render({errorMessage}) {
        return !errorMessage ? null : <InputErrors errors={ [{message: errorMessage}] }/>;
    }
}

class InputErrors extends preact.Component {
    /**
     * @param {{vm?: preact.Component; prop?: String; errors?: Array<{message: String;}>;}} props
     * @access protected
     */
    render({vm, prop, errors}) {
        let doShowError = true;
        if (!Array.isArray(errors)) {
            if (!vm || !prop) throw new Error('Usage: <InputErrors vm={ this } prop="inputName"/> or <InputErrors errors={ [{message: "Some error"}] }/>');
            errors = vm.state.errors[prop];
            doShowError = vm.state.blurStates[prop] === true;
        }
        const lastIdx = errors.length - 1;
        return lastIdx < 0
            ? null
            : <span class={ `has-error mt-1 d-${doShowError ? 'inline-block' : 'none' }` }>{
                errors.map(({message}, i) =>
                    <span class={ `form-input-hint${i !== lastIdx ? ' mr-1' : ''}` }>
                        { message }
                    </span>
                )
            }</span>;
    }
}

class FormGroup extends preact.Component {
    /**
     * @param {{className?: String;}} props
     */
    render({children, className}) {
        return <div class={ 'form-group' + (!className ? '' : ` ${className}`) }>{ children }</div>;
    }
}

class FormGroupInline extends preact.Component {
    /**
     * @param {{className?: String; labelFlow?: 'ellipsis'|'break';}} props
     */
    render({children, className, labelFlow}) {
        return <div className={ 'form-group' + (!className ? '' : ` ${className}`) }>
            <div class={ `col-3 ${(labelFlow || 'ellipsis') === 'ellipsis' ? 'text-ellipsis' : 'text-break'}` }>
                { children[0] }
            </div>
            <div class="col-9">
                { children[1] }
            </div>
            { children[2] || null }
        </div>;
    }
}

/**
 * @typedef InputDef
 * @prop {String} name e.g. 'numColumns'
 * @prop {String|Number} value e.g. 1, 'foo'
 * @prop {Array<[String, ...any]>} validations e.g. [['min', 0], ['max', 12]]
 * @prop {String=} id e.g. 'numColumns'
 * @prop {String=} label e.g. 'Num columns'
 * @prop {String=} valueType e.g. 'int'
 * @prop {String=} type e.g. 'number'
 * other props
 */

export {
    FormGroup,
    FormGroupInline,
    handleSubmit,
    hasErrors,
    hookForm,
    Input,
    InputErrors,
    InputError,
    reHookValues,
    Textarea,
    unhookForm,
    validateAll,
};
