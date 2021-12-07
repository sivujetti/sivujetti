import {http, __, env, urlUtils} from '../edit-app/src/commons/main.js';
import {useField, useValidations, FormGroup, InputErrors} from '../edit-app/src/commons/Form2.jsx';

/**
 * Renders a login form.
 */
const LoginApp = () => {
    const username = useField('username', {validations: [['minLength', 2]], label: __('Username')});
    const password = useField('password', {type: 'password', validations: [['minLength', 1]], label: __('Password')});
    const form = useValidations([username, password]);
    const [message, setMessage] = preactHooks.useState(null);
    /**
     * @param {Event} e
     */
    const handleSubmit = e => {
        e.preventDefault();
        if (form.validateAll() === 0)
            return;
        http.post('/api/auth/login', {
            username: username.value,
            password: password.value,
        })
        .then(resp => {
            if (resp.ok === "ok") {
                urlUtils.redirect('/_edit');
                return;
            }
            const errorMessage = errorCodeToMessage(resp.errorCode);
            if (errorMessage)
                setMessage({level: 'error', text: __(errorMessage)});
            else
                throw new Error('Something unexpected happened');
        })
        .catch(err => {
            setMessage({level: 'error', text: __('Something went wrong.')});
            env.window.console.error(err);
        });
    };
    //
    return <form onSubmit={ handleSubmit }>
        { !message
            ? null
            : <div class={ `box ${message.level} mb-2` }>{ message.text }</div>
        }
        <FormGroup className="mb-1">
            <label htmlFor="username" class="form-label">{ __('Username') }</label>
            <input { ...username }/>
            <InputErrors errors={ username.getErrors() }/>
        </FormGroup>
        <FormGroup>
            <label htmlFor="password" class="form-label">{ __('Password') }</label>
            <input { ...password }/>
            <InputErrors errors={ password.getErrors() }/>
        </FormGroup>
        <div class="mt-2 pt-2">
            <button class="btn btn-primary" type="submit" disabled={ form.hasValidationErrors }>{ __('Login') }</button>
            <a href={ urlUtils.makeUrl('/jet-reset-pass') } class="p-2 ml-1">{ __('Forgot password?') }</a>
        </div>
    </form>;
};

/**
 * @param {Number} errorCode
 * @returns {String|undefined}
 */
function errorCodeToMessage(errorCode) {
    return {
        201010: __('Invalid credentials'), // CREDENTIAL_WAS_INVALID,
        201015: __('Account not activated'), // ACCOUNT_STATUS_WAS_UNEXPECTED,
    }[errorCode];
}

export default LoginApp;
