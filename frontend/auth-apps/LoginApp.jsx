import {http, __, env, urlUtils, hookForm, hasErrors, validateAll, Input,
        InputErrors, FormGroup} from '@sivujetti-commons-for-edit-app';

/**
 * Renders a login form.
 */
class LoginApp extends preact.Component {
    /**
     * @param {{dashboardUrl?: String;}} props
     */
    constructor(props) {
        super(props);
        this.state = hookForm(this, [
            {name: 'username', validations: [['minLength', 2]], label: __('Username')},
            {name: 'password', validations: [['minLength', 1]], label: __('Password')},
        ], {
            message: null,
        });
    }
    /**
     * @access protected
     */
    render(_, {message}) {
        return <form onSubmit={ this.handleSubmit.bind(this) }>
            { !message
                ? null
                : <div class={ `box ${message.level} mb-2` }>{ message.text }</div>
            }
            <FormGroup>
                <label htmlFor="username" class="form-label">{ __('Username') }</label>
                <Input vm={ this } prop="username"/>
                <InputErrors vm={ this } prop="username"/>
            </FormGroup>
            <FormGroup>
                <label htmlFor="password" class="form-label">{ __('Password') }</label>
                <Input vm={ this } prop="password" type="password"/>
                <InputErrors vm={ this } prop="password"/>
            </FormGroup>
            <div class="mt-2 pt-2">
                <button class="btn btn-primary" type="submit" disabled={ hasErrors(this) }>{ __('Login') }</button>
                <a href={ urlUtils.makeUrl('/jet-reset-pass') } class="p-2 ml-1">{ __('Forgot password?') }</a>
            </div>
        </form>;
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleSubmit(e) {
        e.preventDefault();
        if (!validateAll(this))
            return;
        http.post('/api/auth/login', {
            username: this.state.values.username,
            password: this.state.values.password,
        })
        .then(resp => {
            if (resp.ok === "ok") {
                const hash = env.window.location.hash;
                const at = hash.indexOf('?');
                const vars = at > 0 ? hash.substr(at + 1).split('&') : [];
                const returnToVar = vars.find(v => v.startsWith('return-to='));
                if (!returnToVar)
                    urlUtils.redirect('/_edit');
                else if (returnToVar === 'return-to=dashboard')
                    env.window.location.href = this.props.dashboardUrl;
                return;
            }
            const errorMessage = errorCodeToMessage(resp.errorCode);
            if (errorMessage)
                this.setState({message: {level: 'error', text: __(errorMessage)}});
            else
                throw new Error('Something unexpected happened');
        })
        .catch(err => {
            this.setState({message: {level: 'error', text: __('Something went wrong.')}});
            env.window.console.error(err);
        });
    }
}

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
