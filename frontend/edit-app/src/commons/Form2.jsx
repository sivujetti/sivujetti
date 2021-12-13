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
 * @param {String} id
 * @param {{validations: Array<[String, ...any]>; value?: String; label?: String; type?: String; className?: String; [key: String]: any; onAfterValidation?: (value: any, hasErrors: Boolean) => void;}|undefined} attrs = {}
 * @returns {InputState & {[key: String]: any;}}
 */
const useField = (id, attrs = {}) => {
    const [value, setValue] = preactHooks.useState(attrs.value !== undefined ? attrs.value : undefined);
    const [errors, setErrors] = preactHooks.useState({});
    const [hasTouched, setHasTouched] = preactHooks.useState(false);
    const [isBlurred, setIsBlurred] = preactHooks.useState(false);
    //
    /**
     * @param {Event} e
     */
    const onInput = e => {
        if (attrs.onBeforeHandleInput) attrs.onBeforeHandleInput(e);
        setHasTouched(true);
        setValue(e.target.value);
    };
    const doValidate = () =>
        (attrs.validations || []).reduce((hasErrors, [validatorName, ...args]) => {
            const {doValidate, errorMessageTmpl} = validatorImplFactories[validatorName]();
            const prevIsValid = errors[validatorName] === undefined;
            const isValid = doValidate(value !== undefined ? value : '', ...args);
            if (!isValid && prevIsValid)
                setErrors(Object.assign({}, errors, {[validatorName]: formatError(errorMessageTmpl, attrs.label, args)}));
            else if (isValid && !prevIsValid)
                setErrors(Object.assign({}, errors, {[validatorName]: undefined}));
            return hasErrors ? true : isValid !== true;
        }, false)
    ;
    //
    preactHooks.useEffect(() => {
        if (!hasTouched) return;
        const hasErrors = doValidate();
        if (attrs.onAfterValidation) attrs.onAfterValidation(value, hasErrors);
    }, [value]);
    //
    return {
        id,
        type: attrs.type || 'text',
        value,
        getErrors: () => {
           return !isBlurred
                ? []
                : Object.keys(errors).map(key => errors[key]).filter(v => v !== undefined);
        },
        doValidate,
        errors,
        isBlurred,
        hasTouched,
        onInput,
        onBlur: () => {
            setIsBlurred(true);
            if (!hasTouched) {
                setHasTouched(true);
                doValidate();
            }
        },
        className: attrs.className || 'form-input',
    };
};

/**
 * @param {Array<InputState & {[key: String]: any;}>} inputStates
 * @returns {{hasValidationErrors: Boolean; validateAll: () => Number;}}
 */
const useValidations = inputStates => {
    const [hasValidationErrors, setHasValidationErrors] = preactHooks.useState(false);
    const [initialized, setIsInitialized] = preactHooks.useState(false);
    //
    const errArrs = inputStates.map(inputState =>
        inputState.getErrors()
    );
    const setHasErrorsFromEach = () => {
        if (!initialized) setIsInitialized(true);
        setHasValidationErrors(errArrs.some(arr => arr.length > 0));
    };
    preactHooks.useEffect(setHasErrorsFromEach, errArrs.map(arr => arr.join(',')));
    //
    return {
        hasValidationErrors,
        initialized,
        validateAll: () => {
            let numTouches = 0;
            let triggeredBlur = false;
            for (const attrs of inputStates) {
                const hasTouched = attrs.hasTouched;
                if (!hasTouched && !triggeredBlur) {
                    if (attrs.value === undefined)
                        attrs.onInput({target: {value: ''}});
                    attrs.onBlur();
                    triggeredBlur = true;
                }
                numTouches += hasTouched ? 1 : 0;
            }
            return numTouches;
        }
    };
};

/**
 * @type {preact.FunctionalComponent<{className?: String;}>}
 */
const FormGroup = ({className, children}) =>
    <div class={ 'form-group' + (!className ? '' : ` ${className}`) }>{ children }</div>
;

/**
 * @type {preact.FunctionalComponent<{className?: String;}>}
 */
const FormGroupInline = ({children, className}) =>
    <div className={ 'form-group' + (!className ? '' : ` ${className}`) }>
        <div class="col-3 text-ellipsis">
            { children[0] }
        </div>
        <div class="col-9">
            { children[1] }
        </div>
        { children[2] || null }
    </div>
;

/**
 * @type {preact.FunctionalComponent<{errors: Array<String>;}>}
 */
const InputErrors = ({errors}) =>
    !errors.length ? null : <div>{ errors.join(', ') }</div>
;

/**
 * @typedef InputState
 * @prop {String} id
 * @prop {String} type
 * @prop {String} value
 * @prop {() => Array<String>} getErrors
 * @prop {() => Boolean} doValidate
 * @prop {Object} errors
 * @prop {Boolean} isBlurred
 * @prop {Boolean} hasTouched
 * @prop {(e: Event) => void} onInput
 * @prop {() => void} onBlur
 * @prop {String} className
 */

export {useField, useValidations, FormGroup, FormGroupInline, InputErrors};
