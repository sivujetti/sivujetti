import {__, env, http, urlUtils, Icon, LoadingSpinner, hookForm, Input, InputErrors,
        hasErrors, unhookForm, FormGroup, validationConstraints} from '@sivujetti-commons-for-edit-app';
import {urlValidatorImpl} from '../validation.js';
import setFocusTo from '../block-types/auto-focusers.js';
import {determineModeFrom, getLabel, normalizeExternalUrl, normalizeUrl} from '../quill/common.js';
import FileUploader from '../commons/FileUploader.jsx';

class PickUrlDialog extends preact.Component {
    /**
     * @param {{mode: urlMode; url: String|null; dialog: FloatingDialog; onConfirm: (url: String, mode: urlMode) => void;}} props
     */
    constructor(props) {
        super(props);
        const [url, hash] = props.url.split('#');
        this.state = {mode: props.mode, url, hash: hash || '', openPopup: null};
    }
    /**
     * @param {String} value
     * @param {Boolean} hasErrors
     * @access public
     */
    onJumpToChanged(value, hasErrors) {
        this.setState({hash: !hasErrors ? value : this.state.hash, jumpToIsValid: !hasErrors});
    }
    /**
     * @access protected
     */
    componentDidMount() {
        this.props.dialog.setHeight(getHeight(this.state.mode));
    }
    /**
     * @access protected
     */
    render(_, {mode, openPopup, jumpToIsValid}) {
        return <div>
            <div class="button-options small-buttons four">
                <button class={ `form-radio btn focus-default${mode === 'choose-link-type' ? ' selected' : ''}` } onClick={ this.clearLink.bind(this) }>
                    <span>
                        <input type="radio" name="linkType" checked={ mode === 'choose-link-type' } tabIndex="-1"/>
                        <i class="form-icon"></i>
                        <span class="with-icon ml-2"><Icon iconId="ban" className="size-sm color-dimmed"/>-</span>
                    </span>
                </button>
                <button class={ `form-radio btn focus-default${mode === 'pick-url' ? ' selected' : ''}` } onClick={ () => this.openPopup('pick-url') }>
                    <span>
                        <input type="radio" name="linkType" checked={ mode === 'pick-url' } tabIndex="-1"/>
                        <i class="form-icon"></i>
                        <span class="with-icon ml-2"><Icon iconId="file-text" className="size-sm color-dimmed"/>{ __('Page') }</span>
                    </span>
                </button>
                <button class={ `form-radio btn focus-default${mode === 'pick-file' ? ' selected' : ''}` } onClick={ () => this.openPopup('pick-file') }>
                    <span>
                        <input type="radio" name="linkType" checked={ mode === 'pick-file' } tabIndex="-1"/>
                        <i class="form-icon"></i>
                        <span class="with-icon ml-2"><Icon iconId="photo" className="size-sm color-dimmed"/>{ __('Image') }</span>
                    </span>
                </button>
                <button class={ `form-radio btn focus-default${mode === 'type-external-url' ? ' selected' : ''}` } onClick={ () => this.openPopup('type-external-url') }>
                    <span>
                        <input type="radio" name="linkType" checked={ mode === 'type-external-url' } tabIndex="-1"/>
                        <i class="form-icon"></i>
                        <span class="with-icon ml-2"><Icon iconId="external-link" className="size-sm color-dimmed"/>{ __('External') }</span>
                    </span>
                </button>
            </div>
            { this.renderPopup(openPopup) }
            <div class="mt-2" style="padding: .4rem .2rem .8rem .2rem;border-bottom: 1px solid hsl(240deg 15.79% 92.27%);">
                { mode !== 'choose-link-type'
                    ? <CurrentUrlDisplay mode={ mode } url={ this.getCurrentUrlWithHash() } parent={ this }/>
                    : <div>{ __('No link selected') }.</div>
                }
            </div>
            <div class="mt-8">
                <button
                    onClick={ this.commitAndClose.bind(this) }
                    class="btn btn-sm btn-primary px-2"
                    type="button"
                    disabled={ mode === 'choose-link-type' || jumpToIsValid === false }>Ok</button>
            </div>
        </div>;
    }
    /**
     * @access private
     */
    clearLink() {
        if (this.state.mode === 'choose-link-type') return;
        this.setState({mode: 'choose-link-type', openPopup: null, hash: ''});
        this.props.dialog.setHeight(getHeight('choose-link-type'));
    }
    /**
     * @access private
     */
    closePopup() {
        this.setState({openPopup: null});
        this.props.dialog.setHeight(getHeight(this.state.mode));
    }
    /**
     * @param {urlMode} popupName
     * @access private
     */
    openPopup(popupName) {
        if (this.state.openPopup === popupName) return;
        this.setState({openPopup: popupName});
        const popupHeight = {
            'pick-url': 400,
            'pick-file': 500,
            'type-external-url': 227,
        }[popupName];
        this.props.dialog.setHeight(popupHeight, 'animate');
    }
    /**
     * @access private
     */
    closeDialog() {
        this.props.dialog.close();
    }
    /**
     * @param {urlMode} popupName
     * @returns {preact.ComponentChild}
     * @access private
     */
    renderPopup(pop) {
        if (pop === null) return null;
        let content;
        let arrowLeft;
        if (pop === 'pick-url')
            [content, arrowLeft] = [<PickPageTab
                url={ this.state.url }
                onPickurl={ slug => this.commitLocally(urlUtils.makeUrl(slug), 'pick-url') }/>, 138];
        if (pop === 'pick-file')
            [content, arrowLeft] = [<FileUploader
                mode="pick"
                onEntryClicked={ entry => { this.commitLocally(urlUtils.makeAssetUrl(`/public/uploads${entry.baseDir}/${entry.fileName}`), 'pick-file'); } }
                numColumns="3"
                hideUploadButton/>, 247];
        if (pop === 'type-external-url')
            [content, arrowLeft] = [<DefineExternalUrlTab
                url={ this.state.url.split('#')[0] }
                onUrlChanged={ validUrl => {
                    this.currentExternalUrl = normalizeExternalUrl(validUrl);
                } }
                done={ doCommit => doCommit ? this.commitLocally(this.currentExternalUrl, 'type-external-url') : this.closePopup() }/>, 371];
        return <div class="my-tooltip static-tooltip visible">
            { content }
            <div class="popper-arrow" style={ `left:${arrowLeft}px` } data-popper-arrow></div>
            <button
                onClick={ this.closePopup.bind(this) }
                class="btn btn-link btn-sm p-1 p-absolute"
                title={ __('Close') }
                style="right:0;top:0;background:0 0"
                type="button">
                <Icon iconId="x" className="size-xs"/>
            </button>
        </div>;
    }
    /**
     * @param {String} url
     * @param {urlMode} newMode
     * @access private
     */
    commitLocally(url, newMode) {
        const hash = newMode !== this.state.mode ? '' : this.state.hash;
        this.setState({url, hash, mode: newMode, openPopup: null});
        this.props.dialog.setHeight(getHeight(newMode));
    }
    /**
     * @param {String} url
     * @param {urlMode} newMode
     * @access private
     */
    commitAndClose() {
        const {mode} = this.state;
        const completed = this.getCurrentUrlWithHash();
        this.props.onConfirm(completed.slice(0, validationConstraints.HARD_SHORT_TEXT_MAX_LEN), mode);
        this.closeDialog();
    }
    /**
     * @returns {String}
     * @access private
     */
    getCurrentUrlWithHash() {
        const {url, hash} = this.state;
        return url + `${hash ? `#${hash}` : ''}`;
    }
}

class CurrentUrlDisplay extends preact.Component {
    /**
     * @access protected
     */
    componentDidMount() {
        if (this.doShowJumpTo(this.props.mode, this.props.url))
            this.hookFormState();
    }
    /**
     * @param {{url: String; mode: urlMode; parent: PickUrlDialog;}} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        const a = this.state.values;
        const b = this.doShowJumpTo(props.mode, props.url);
        if (a && !b) {
            unhookForm(this);
            this.setState({values: null});
        } else if (!a && b) {
            this.hookFormState();
        }
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        if (this.state.values)
            unhookForm(this);
    }
    /**
     * @access protected
     */
    render({url, mode}) {
        const title = getLabel(mode, 'previewTooltipTitles');
        const icon = {
            'pick-url': 'file',
            'pick-file': 'photo',
            'type-external-url': 'external-link',
        }[mode];
        const urlPreview = normalizeUrl(url, mode);
        const linkTitlePrefix = mode !== 'type-external-url' ? env.window.location.origin : '';
        return <div>
            <div class="with-icon color-dimmed">
                <Icon iconId={ icon } className="size-xs color-dimmed3"/>
                { title }
            </div>
            <div class="mt-2">
                <a
                    href={ url }
                    class="d-inline-block pr-1 text-ellipsis"
                    title={ linkTitlePrefix + url }
                    style="max-width: 100%"
                    target="_blank"><b>{ urlPreview }</b></a>
                <br/>
                <button
                    style="transform: scale(.9);margin-left: -.1rem;"
                    onClick={ () => this.props.parent.openPopup(mode) }
                    class="btn btn-sm focus-default mt-1"
                    type="button">{ __('Change') }</button>
                { this.state.values ? <FormGroup className="mt-2">
                    <label class="form-label pb-0 color-dimmed" htmlFor="jumpTo">{ __('Jump in page') }</label>
                    <span class="has-icon-right d-flex flex-centered my-1">
                        #
                        <Input vm={ this } prop="jumpTo" placeholder={ `${__('Anchor').toLowerCase()}-1` } class="form-input tight ml-1"/>
                    </span>
                    <InputErrors vm={ this } prop="jumpTo"/>
                </FormGroup> : null }
            </div>
        </div>;
    }
    /**
     * @access private
     */
    hookFormState() {
        const hash = this.props.url.split('#')[1];
        this.setState(hookForm(this, [
            {name: 'jumpTo', value: hash, validations: [['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]],
            label: __('Jump to'), onAfterValueChanged: (value, hasErrors) => {
                this.props.parent.onJumpToChanged(value, hasErrors);
            }},
        ]));
    }
    /**
     * @param {urlMode} mode
     * @param {String} url
     * @returns {Boolean}
     * @access private
     */
    doShowJumpTo(mode, url) {
        return mode === 'pick-url' || (mode === 'type-external-url' && url.startsWith('http'));
    }
}

// ----

class PickPageTab extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState({pages: null});
        http.get('/api/pages/Pages')
            .then(pages => {
                if (this.props.url) {
                    const short = this.props.url.substring(urlUtils.baseUrl.length - 1);
                    this.setState({pages: pages.sort(({slug}, _b) => slug === short ? -1 : 0),
                                   selectedIdx: 0});
                } else
                    this.setState({pages, selectedIdx: null});
            })
            .catch(env.window.console.error);
    }
    /**
     * @access protected
     */
    render({onPickurl}, {pages, selectedIdx}) {
        const p = pages === null ? null : pages || [];
        return [
            <input
                class="form-input mb-2"
                placeholder={ __('Filter') }
                disabled/>,
            Array.isArray(p) ? <ul class={ `list table-list selectable-items${selectedIdx !== null ? ' has-first-item-selected' : '' }` }>{ p.map(({title, slug}, i) =>
                <li class="p-0"><button
                    class="btn btn-link my-0 col-12 text-left text-ellipsis"
                    onClick={ () => onPickurl(slug) }
                    style="height: 2.2rem">
                        <span class="h6 my-0 mr-1">{ title }</span>
                        <i class="color-dimmed">{ slug }</i>
                    </button>
                </li>
            ) }</ul> : <LoadingSpinner/>
        ];
    }
}

// ----

class DefineExternalUrlTab extends preact.Component {
    // nameInput;
    // enterPressedAt;
    /**
     * @param {{url: String; onUrlChanged: (validUrl: String) => void; done: (doCommit: Boolean) => void;}} props
     */
    constructor(props) {
        super(props);
        const url = props.url && determineModeFrom(props.url)[0] === 'type-external-url' ? unnormalizeExternalUrl(props.url) : '';
        this.nameInput = preact.createRef();
        this.componentWillMount();
        this.state = hookForm(this, [
            {name: 'url', value: url, validations: [
                [urlValidatorImpl, {allowEmpty: true, allowLocal: false}],
                ['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]
            ], label: __('Url address'), onAfterValueChanged: (value, hasErrors) => { if (!hasErrors) props.onUrlChanged(value); }},
        ]);
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.enterPressedAt = null;
    }
    /**
     * @access protected
     */
    componentDidMount() {
        setFocusTo(this.nameInput);
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
    render({done}) {
        const e = hasErrors(this);
        return [
            <div>
                <Input vm={ this } prop="url" placeholder={ __('website.com') } onKeyDown={ e => {
                    if (e.key === 'Enter' && !this.enterPressedAt) this.enterPressedAt = Date.now();
                } } onKeyUp={ e => {
                    if (!this.enterPressedAt || e.key !== 'Enter') return;
                    if ((Date.now() - this.enterPressedAt) < 100) this.props.done(e !== true);
                    else this.enterPressedAt = null;
                } } style="width: calc(100% - 1rem);" ref={ this.nameInput }/>
                <InputErrors vm={ this } prop="url"/>
            </div>,
            <button class="btn btn-primary btn-sm mt-2 px-2" disabled={ e } onClick={ () => done(e !== true) }>Ok</button>,
            <button class="btn btn-sm btn-link mt-2 ml-1" onClick={ () => done(false) }>{ __('Cancel') }</button>
        ];
    }
}

/**
 * @param {urlMode} mode
 * @returns {Number}
 */
function getHeight(mode) {
    if (mode === 'pick-url' || mode === 'type-external-url')
        return 370;
    if (mode === 'pick-file')
        return 296;
    return 233;
}

/**
 * @param {String} url
 * @returns {String|null}
 */
function unnormalizeExternalUrl(url) {
    if (url.startsWith('//')) return url.substring(2);
    return url.startsWith('/') ? null : url;
}

export default PickUrlDialog;
export {getHeight};
