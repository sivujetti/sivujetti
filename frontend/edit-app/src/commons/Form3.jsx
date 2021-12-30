import {__} from './main.js';

const validatorImplFactories = {
    'required':  () => ({doValidate: value => !!value, errorMessageTmpl: __('required')}),
    'minLength': () => ({doValidate: (value, min) => value.length >= min, errorMessageTmpl: __('minLength')}),
    'maxLength': () => ({doValidate: (value, max) => value.length <= max, errorMessageTmpl: __('maxLength')}),
    'min':       () => ({doValidate: (value, min) => value >= min, errorMessageTmpl: __('min')}),
    'max':       () => ({doValidate: (value, max) => value <= max, errorMessageTmpl: __('max')}),
    'regexp':    () => ({doValidate: (value, pattern) => (new RegExp(pattern)).test(value), errorMessageTmpl: __('{field} contains forbidden characters')}),
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
 * @param {Array<todo>} inps
 * @param {{[key: String]: any;}} initialState = {}
 * @returns {{[key: String]: any;}}
 */
function hookForm(cmp, inps, initialState = {}) {
    const values = {};
    const errors = {};
    const inputApis = {};
    inps.forEach(inp => {
        const k = mkKey(inp);
        values[k] = inp.value;
        errors[k] = [];
        inputApis[k] = createApi(cmp, k, inp);
    });
    cmp.inputApis = inputApis;
    return Object.assign(initialState, {values, errors});
}

/**
 * @param {preact.Component} cmp
 * @param {String} k
 * @param {todo} inp
 * @returns {todo2}
 */
function createApi(cmp, k, inp) {
    const out = {};
    out.name = inp.name;
    out.type = inp.type || 'text';
    out.className = inp.className || 'form-input';
    out.doValidate = value =>
        (inp.validations || []).reduce((errors, [validatorName, ...args]) => {
            const {doValidate, errorMessageTmpl} = validatorImplFactories[validatorName]();
            const isValid = doValidate(value !== undefined ? value : '', ...args);
            if (!isValid)
                return errors.concat({type: validatorName, message: formatError(errorMessageTmpl, inp.label, args)});
            else
                return errors;
        }, [])
    ;
    out.triggerInput = (value, isProgrammatic = false) => {
        const errors = out.doValidate(value);
        const newState = {values: Object.assign({}, cmp.state.values, {[k]: value}),
                          errors: Object.assign({}, cmp.state.errors, {[k]: errors})};
        cmp.setState(newState);
        if (!isProgrammatic && inp.onAfterValueChanged) inp.onAfterValueChanged(value, errors.length);
    };
    out.onInput = e => {
        out.triggerInput(e.target.value);
    };
    return out;
}

/**
 * @param {preact.Component} cmp
 */
function unhookForm(cmp) {
    'todo', cmp;
}

/**
 * @param {preact.Component} cmp
 * @param {Array<todo>} inps
 */
function reHookValues(cmp, inps) {
    inps.forEach(inp => {
        cmp.inputApis[mkKey(inp)].triggerInput(inp.value, true);
    });
}

/**
 * @param {todo} inp
 * @returns {String}
 */
function mkKey(inp) {
    return inp.id || inp.name; // todo sanity check tai throw
}

class Input extends preact.Component {
    /**
     * @param {{vm: preact.Component; prop: String;}} props
     * @access protected
     */
    render({vm, prop}) {
        return <input
            { ...vm.inputApis[prop] }
            value={ vm.state.values[prop] }/>;
    }
}

class InputErrors extends preact.Component {
    /**
     * @param {{vm: preact.Component; prop: String;}} props
     * @access protected
     */
    render({vm, prop}) {
        const errors = vm.state.errors[prop];
        return !errors.length ? null : <span>{ errors.map(({message}) => <span>{ message }</span>) }</span>;
    }
}

class FormGroupInline extends preact.Component {
    /**
     * @param {{className?: String;}} props
     */
    render({children, className}) {
        return <div className={ 'form-group' + (!className ? '' : ` ${className}`) }>
            <div class="col-3 text-ellipsis">
                { children[0] }
            </div>
            <div class="col-9">
                { children[1] }
            </div>
            { children[2] || null }
        </div>;
    }
}

export default hookForm;
export {unhookForm, reHookValues, Input, InputErrors, FormGroupInline};
