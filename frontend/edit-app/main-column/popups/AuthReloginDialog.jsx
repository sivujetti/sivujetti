import {
    __,
    api,
    env,
    floatingDialog,
    FormGroup,
    handleSubmit,
    hookForm,
    http,
    Input,
    InputErrors,
    urlUtils,
} from '@sivujetti-commons-for-edit-app';

/** @extends {preact.Component<{onSuccesfulRelogin(): void;}, any>} */
class AuthReloginDialog extends preact.Component {
    componentWillMount() {
        this.setState(hookForm(this, [
            {name: 'username', validations: [['minLength', 2]], label: __('Username')},
            {name: 'password', validations: [['minLength', 1]], label: __('Password')},
        ]));
    }
    /**
     * @access protected
     */
    render(_, {formIsSubmittingClass}) {
        return <form onSubmit={ e => handleSubmit(this, this.relogin.bind(this), e) }>
            <p class="text-prose mb-2">{
                __('The login information could not be found or it has expired – please log in again to continue.')
            }</p>
            <FormGroup>
                <label htmlFor="username" class="form-label">{ __('Username') }</label>
                <Input vm={ this } prop="username" id="username"/>
                <InputErrors vm={ this } prop="username"/>
            </FormGroup>
            <FormGroup className="pb-2">
                <label htmlFor="password" class="form-label">{ __('Password') }</label>
                <Input vm={ this } prop="password" id="password" type="password"/>
                <InputErrors vm={ this } prop="password"/>
            </FormGroup>
            <div class="pt-2">
                <button
                    class={ `btn btn-primary mr-2${formIsSubmittingClass}` }
                    disabled={ !!formIsSubmittingClass }
                    type="submit">{ __('Login again') }</button>
                <button
                    onClick={ () => urlUtils.redirect('/') }
                    class="btn btn-link"
                    type="button">{ __('Exit edit mode') }</button>
            </div>
        </form>;
    }
    /**
     * @returns {Promise<void>}
     * @access private
     */
    async relogin() {
        try {
            const resp = await http.post('/api/auth/login', {
                username: this.state.values.username,
                password: this.state.values.password,
            });
            if (resp.ok === 'ok') {
                this.props.onSuccesfulRelogin();
                floatingDialog.close();
            } else {
                const errorMessage = errorCodeToMessage(resp.errorCode);
                if (errorMessage)
                    api.toasters.editAppMain(__(errorMessage), 'error');
                else
                    throw new Error('Something unexpected happened.');
            }
        } catch (message) {
            api.toasters.editAppMain(__('Something went wrong.'), 'error');
            env.window.console.error(message);
        }
    }
}

/**
 * @param {number} errorCode
 * @returns {string|undefined}
 */
function errorCodeToMessage(errorCode) {
    return {
        201010: __('Invalid credentials'), // CREDENTIAL_WAS_INVALID,
        201015: __('Account not activated'), // ACCOUNT_STATUS_WAS_UNEXPECTED,
    }[errorCode];
}

export default AuthReloginDialog;
