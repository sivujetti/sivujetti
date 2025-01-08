import {
    __,
    env,
    floatingDialog,
    handleSubmit,
    http,
    LoadingSpinner,
} from '@sivujetti-commons-for-edit-app';

/** @extends {preact.Component<any, any>} */
class WebsiteDiagnoseIssuesDialog extends preact.Component {
    /**
     * @access protected
     */
    render(_, {issues, formIsSubmittingClass}) {
        if (!issues)
            return <form onSubmit={ e => handleSubmit(this, this.fetchIssues.bind(this), e) } class="text-prose">
                { !issues
                    ? <p class="mb-2 pb-1">{
                        __('Run a health check that scans the website for potential security and functionality issues?')
                    }</p>
                    : <LoadingSpinner/>
                }
                <div>
                    <button
                        class={ `btn btn-primary mr-2${formIsSubmittingClass}` }
                        disabled={ !!formIsSubmittingClass }
                        type="submit">{ __('Run health check') }</button>
                    <button
                        onClick={ () => floatingDialog.close() }
                        class="btn btn-link"
                        type="button">{ __('Cancel') }</button>
                </div>
            </form>;
        return <div class="text-prose">{ issues.length
            ? [
                <p class="mb-2">{ __('The check detected the following issues:') }</p>,
                ...issues.map(({issue, detail}) => {
                    const [level, title, message] = (() => {
                        if (issue === 'Backend directory is publicly accessible') {
                            const [level, messageKey] = detail === 'isFineBecauseLocalhost'
                                ? ['notice', 'The backend directory is currently accessible through the web browser. This is fine during development, but remember to move it outside of the public web root directory when deploying to production to prevent unauthorized access to sensitive files.']
                                : ['error', 'The backend directory is currently accessible through the web browser, which poses a security risk. It should be moved outside of the public web root directory to prevent unauthorized access to sensitive files.'];
                            return [level, __('Backend directory is publicly accessible'), __(messageKey)];
                        }
                        if (issue === 'Xdebug is enabled')
                            return ['notice', __('Xdebug is enabled'), __('Xdebug php extension is currently enabled while display_errors is also on. This configuration should not be used in production environments as it can expose sensitive information.')];
                        if (issue === 'Website is hidden from search engines')
                            return ['notice', __('Website is hidden from search engines'), detail === 'isNotHiddenInSettings'
                                ? __('The website is currently hidden from search engines even though search engine indexing is enabled in the site settings. This is caused by Site.php or a plugin modifying the <head> section markup. You can resolve this issue by removing the markup-modifying filter from Site.php or the relevant plugin.')
                                : __('The website is currently hidden from search engines in the site settings. If you want your site to be discoverable, you can change this setting in the form found under \'%s (%s) > %s\'.',
                                    __('Website'), __('Website\'s settings'), __('Edit info'))
                            ];
                        if (issue === 'File conflict detected')
                            return ['notice', __('File conflict detected'), __('A static index.html file was found on the server which overrides the default index.php file. This prevents the page editing functionality from working properly. You can resolve this issue by removing or renaming the conflicting file.')];
                        return ['error', '', ''];
                    })();
                    return <div class={ `info-box ${level} mb-2` }>
                        <b class="d-inline-block mb-2">{ title }</b>
                        <p class="mb-1">{ message }</p>
                    </div>;
                } )
            ]
            : <p class="mb-2">{ __('The check found no issues.') }</p>
        }</div>;
    }
    /**
     * @access private
     */
    async fetchIssues() {
        try {
            const issues = await http.get('/api/the-website/issues');
            this.setState({issues});
        } catch (message) {
            return env.window.console.error(message);
        }
    }
}

export default WebsiteDiagnoseIssuesDialog;
