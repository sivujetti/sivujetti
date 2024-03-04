import {
    __,
    api,
    FormGroup,
    handleSubmit,
    hookForm,
    http,
    Icon,
    InputErrors,
    LoadingSpinner,
    setFocusTo,
    Textarea,
    unhookForm,
    validationConstraints,
} from '../../../sivujetti-commons-unified.js';
import globalData from '../../includes/globalData.js';
import toasters from '../../includes/toasters.jsx';
import OverlayView from '../OverlayView.jsx';

class WebsiteEditGlobalScriptsView extends preact.Component {
    // userCanEditGlobalScripts;
    // headHtmlInput;
    // boundHandleSubmit;
    /**
     */
    constructor(props) {
        super(props);
        this.userCanEditGlobalScripts = api.user.can('editTheWebsitesGlobalScripts');
        this.headHtmlInput = preact.createRef();
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.boundHandleSubmit = this.saveChangesToBackend.bind(this);
        this.createState(globalData.theWebsite);
    }
    /**
     * @access protected
     */
    componentDidMount() {
        setFocusTo(this.headHtmlInput);
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        unhookForm(this);
    }
    /**
     * @access protected
     */
    render(_, {formIsSubmittingClass, values}) {
        if (!this.userCanEditGlobalScripts)
            return;
        return <OverlayView>
            <h2>{ __('Edit scripts') }</h2>
            <p style="font-size:.8rem">{ __('In these fields, you can define HTML code (e.g., various analytics scripts) that will be added to the final page\'s <head> tag or at the end of the <body> tag.') }</p>
            <form onSubmit={ e => handleSubmit(this, this.boundHandleSubmit, e) } class="pt-1">{ values ? [
                <FormGroup>
                    <label htmlFor="headHtml" class="form-label pb-0">{ __('Head scripts') }</label>
                    <button
                        onClick={ () => this.appendExampleHtml('head') }
                        class="btn btn-sm text-tiny with-icon-inline color-dimmed my-1"
                        type="button">
                        <Icon iconId="plus" className="size-xs mr-1"/> { __('Append example') }
                    </button>
                    <Textarea vm={ this } prop="headHtml" id="headHtml" rows="2" ref={ this.headHtmlInput }/>
                    <InputErrors vm={ this } prop="headHtml"/>
                </FormGroup>,
                <FormGroup className="pt-2">
                    <label htmlFor="footHtml" class="form-label pb-0">{ __('Body scripts') }</label>
                    <button
                        onClick={ () => this.appendExampleHtml('foot') }
                        class="btn btn-sm text-tiny with-icon-inline color-dimmed my-1"
                        type="button">
                        <Icon iconId="plus" className="size-xs mr-1"/> { __('Append example') }
                    </button>
                    <Textarea vm={ this } prop="footHtml" id="footHtml" rows="8"/>
                    <InputErrors vm={ this } prop="footHtml"/>
                </FormGroup>,
                <button class={ `btn btn-primary mt-8${formIsSubmittingClass}` } type="submit">{ __('Save changes') }</button>
            ] : <LoadingSpinner/> }
            </form>
        </OverlayView>;
    }
    /**
     * @param {TheWebsite} website
     * @access private
     */
    createState(website) {
        this.setState(hookForm(this, [
            {name: 'headHtml', value: website.headHtml, validations: [
                ['maxLength', validationConstraints.MAX_PROSE_HTML_LENGTH]], label: __('Head scripts')},
            {name: 'footHtml', value: website.footHtml, validations: [
                ['maxLength', validationConstraints.MAX_PROSE_HTML_LENGTH]], label: __('Body scripts')},
        ]));
    }
    /**
     * @access private
     */
    saveChangesToBackend() {
        const data = {
            headHtml: this.state.values.headHtml || '',
            footHtml: this.state.values.footHtml || '',
        };
        return http.put('/api/the-website/global-scripts', data)
            .then(resp => {
                if (resp.ok !== 'ok') throw new Error;
                globalData.theWebsite = {
                    ...globalData.theWebsite,
                    ...{
                        headHtml: data.headHtml,
                        footHtml: data.footHtml,
                    }
                };
                toasters.editAppMain(__('Saved global scripts.'), 'success');
            });
    }
    /**
     * @param {String} type
     * @access private
     */
    appendExampleHtml(type) {
        if (type === 'head')
            this.inputApis.headHtml.triggerInput(
                (this.state.values.headHtml ? `${this.state.values.headHtml}\n` : '') +
                '<script async src="https://analytics.umami.is/script.js" data-website-id="{$SITE_ID}"></script>',
                'default'
            );
        else if (type === 'foot')
            this.inputApis.footHtml.triggerInput(
                (this.state.values.footHtml ? `${this.state.values.footHtml}\n` : '') +
                `<!-- Matomo -->\n` +
                `<script>\n` +
                `var _paq=window._paq=window._paq||[];_paq.push(['trackPageView']);_paq.push(['enableLinkTracking']);` +
                `(function(){var u="//{$MATOMO_URL}/";_paq.push(['setTrackerUrl',u+'matomo.php']);` +
                `_paq.push(['setSiteId',{$IDSITE}]);var d=document,g=d.createElement('script'),` +
                `s=d.getElementsByTagName('script')[0];g.type='text/javascript';g.async=true;` +
                `g.src=u+'matomo.js';s.parentNode.insertBefore(g,s)})();\n` +
                `</script>\n` +
                `<!-- End Matomo Code -->`,
                'default'
            );
    }
}

export default WebsiteEditGlobalScriptsView;
