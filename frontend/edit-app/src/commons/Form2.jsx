import {__} from './main.js';

const validatorImplFactories = {
    'minLength': () =>
        ({doValidate: (value, min) => value.length >= min, errorMessageTmpl: __('minLength')})
    ,
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
 * @param {{validations: Array<[String, ...any]>; value?: String; label?: String; type?: String; className?: String; [key: String]: any;}|undefined} attrs = {}
 * @returns {InputState}
 */
const useField = (id, attrs = {}) => {
    const [value, setValue] = preactHooks.useState(attrs.value || undefined);
    const [errors, setErrors] = preactHooks.useState({});
    const [hasTouched, setHasTouched] = preactHooks.useState(false);
    const [isBlurred, setIsBlurred] = preactHooks.useState(false);
    //
    /**
     * @param {Event} e
     */
    const onInput = e => {
        setHasTouched(true);
        setValue(e.target.value);
    };
    const doValidate = () => {
        (attrs.validations || []).forEach(([validatorName, ...args]) => {
            const {doValidate, errorMessageTmpl} = validatorImplFactories[validatorName]();
            const prevIsValid = errors[validatorName] === undefined;
            const isValid = doValidate(value !== undefined ? value : '', ...args);
            if (!isValid && prevIsValid)
                setErrors(Object.assign({}, errors, {[validatorName]: formatError(errorMessageTmpl, attrs.label, args)}));
            else if (isValid && !prevIsValid)
                setErrors(Object.assign({}, errors, {[validatorName]: undefined}));
        });
    };
    //
    preactHooks.useEffect(() => {
        if (!hasTouched) return;
        doValidate();
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
 * @param {Array<InputState>} inputStates
 * @returns {{hasValidationErrors: Boolean; validateAll: () => Number;}}
 */
const useValidations = inputStates => {
    const [hasValidationErrors, setHasValidationErrors] = preactHooks.useState(false);
    //
    const errArrs = inputStates.map(inputState =>
        inputState.getErrors()
    );
    const setHasErrorsFromEach = () => {
        setHasValidationErrors(errArrs.some(arr => arr.length > 0));
    };
    preactHooks.useEffect(setHasErrorsFromEach, errArrs.map(arr => arr.join(',')));
    //
    return {
        hasValidationErrors,
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
    <div class={ 'form-group' + (className ? ` ${className}` : '') }>{ children }</div>
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

export {useField, useValidations, FormGroup, InputErrors};