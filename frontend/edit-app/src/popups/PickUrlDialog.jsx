import {__, env, http, urlUtils, Icon, LoadingSpinner, hookForm, FormGroupInline,
        Input, InputErrors, hasErrors, unhookForm} from '@sivujetti-commons-for-edit-app';
import {urlValidatorImpl} from '../validation.js';
import {validationConstraints} from '../constants.js';
import setFocusTo from '../block-types/auto-focusers.js';
import {determineModeFrom, getLabel, normalizeExternalUrl} from '../quill/common.js';
import FileUploader from '../commons/FileUploader.jsx';

class PickUrlDialog extends preact.Component {
    /**
     * @param {{mode: UrlMode; url: String|null; dialog: FloatingDialog; onConfirm: (url: String, mode: UrlMode) => void;}} props
     */
    constructor(props) {
        super(props);
        this.state = {mode: props.mode, url: props.url, openPopup: null};
    }
    /**
     * @access protected
     */
    componentDidMount() {
        this.props.dialog.setHeight(getHeight(this.state.mode, true)[0]);
    }
    /**
     * @access protected
     */
    render(_, {mode, openPopup}) {
        return <div>
            <div class="button-options small-buttons four">
                <button class={ `form-radio btn${mode === 'choose-link-type' ? ' selected' : ''}` } onClick={ this.clearLink.bind(this) }>
                    <span>
                        <input type="radio" tabIndex="-1" name="sendingMethod"
                            checked={ mode === 'choose-link-type' }
                            value="choose-link-type"/>
                        <i class="form-icon"></i>
                        <span class="with-icon ml-2"><Icon iconId="ban" className="size-sm color-dimmed"/>-</span>
                    </span>
                </button>
                <button class={ `form-radio btn${mode === 'pick-url' ? ' selected' : ''}` } onClick={ () => this.openPopup('pick-url') }>
                    <span>
                        <input type="radio" tabIndex="-1" name="sendingMethod"
                            checked={ mode === 'pick-url' }
                            value="choose-link-type"/>
                        <i class="form-icon"></i>
                        <span class="with-icon ml-2"><Icon iconId="file-text" className="size-sm color-dimmed"/>{ __('Page') }</span>
                    </span>
                </button>
                <button class={ `form-radio btn${mode === 'pick-file' ? ' selected' : ''}` } onClick={ () => this.openPopup('pick-file') }>
                    <span>
                        <input type="radio" tabIndex="-1" name="sendingMethod"
                            checked={ mode === 'pick-file' }
                            value="choose-link-type"/>
                        <i class="form-icon"></i>
                        <span class="with-icon ml-2"><Icon iconId="photo" className="size-sm color-dimmed"/>{ __('Image') }</span>
                    </span>
                </button>
                <button class={ `form-radio btn${mode === 'type-external-url' ? ' selected' : ''}` } onClick={ () => this.openPopup('type-external-url') }>
                    <span>
                        <input type="radio" tabIndex="-1" name="sendingMethod"
                            checked={ mode === 'type-external-url' }
                            value="choose-link-type"/>
                        <i class="form-icon"></i>
                        <span class="with-icon ml-2"><Icon iconId="external-link" className="size-sm color-dimmed"/>{ __('External') }</span>
                    </span>
                </button>
            </div>
            { this.renderPopup(openPopup) }
            <div class="mt-2 pt-2">
                { this.renderCurrentModeEditForm(mode) }
            </div>
            <div class="mt-8">
                <button
                    onClick={ this.closeDialog.bind(this) }
                    class="btn btn-sm btn-primary px-2"
                    type="button">Ok</button>
            </div>
        </div>;
    }
    /**
     * @access private
     */
    clearLink() {
        if (this.state.mode === 'choose-link-type') return;
        this.setState({mode: 'choose-link-type', openPopup: null});
        this.props.dialog.setHeight(getHeight('choose-link-type', true)[0]);
    }
    /**
     * @access private
     */
    closePopup() {
        this.setState({openPopup: null});
        this.props.dialog.setHeight(getHeight(this.state.mode, true)[0]);
    }
    /**
     * @param {UrlMode} popupName
     * @access private
     */
    openPopup(popupName) {
        if (this.state.openPopup === popupName) return;
        this.setState({openPopup: popupName});
        const popupHeight = {
            'pick-url': 400,
            'pick-file': 500,
            'type-external-url': 255,
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
     * @param {UrlMode} popupName
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
                onPickurl={ slug => this.commitAndClose(urlUtils.makeUrl(slug), 'pick-url') }/>, 138];
        if (pop === 'pick-file')
            [content, arrowLeft] = [<FileUploader
                mode="pick"
                onEntryClicked={ entry => { this.commitAndClose(urlUtils.makeAssetUrl(`/public/uploads${entry.baseDir}/${entry.fileName}`), 'pick-file'); } }
                numColumns="3"
                hideUploadButton/>, 247];
        if (pop === 'type-external-url')
            [content, arrowLeft] = [<DefineExternalUrlTab
                url={ this.state.url }
                onUrlChanged={ validUrl => {
                    this.currentExternalUrl = normalizeExternalUrl(validUrl);
                } }
                done={ doCommit => doCommit ? this.commitAndClose(this.currentExternalUrl, 'type-external-url') : this.closePopup() }/>, 371];
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
     * @param {UrlMode} mode
     * @returns {preact.ComponentChild}
     * @access private
     */
    renderCurrentModeEditForm(mode) {
        const {url} = this.state;
        if (mode === 'pick-url') return <Foo url={ this.state.url } mode={ this.state.mode }/>;
        //
        if (mode === 'pick-file') return <div>file: { url }</div>;
        //
        if (mode === 'type-external-url') return <Foo url={ this.state.url } mode={ this.state.mode }/>;
        //
        return <div>{ __('No link selected') }.</div>;
    }
    /**
     * @param {String} url
     * @param {UrlMode} newMode
     * @access private
     */
    commitAndClose(url, newMode) {
        this.props.onConfirm(url.slice(0, validationConstraints.HARD_SHORT_TEXT_MAX_LEN), newMode);
        this.setState({url, mode: newMode, openPopup: null});
        this.props.dialog.setHeight(getHeight(newMode, true)[0]);
    }
}
class Foo extends preact.Component {
    /**
     * @param {{}} props
     */
    constructor(props) {
        super(props);
        this.jumpToInput = preact.createRef();
    }
    /**
     * @access protected
     */
    componentDidMount() {
        this.setState(hookForm(this, [
            {name: 'anchor', value: undefined, validations: [['maxLength', 92 // <- todo
            ]], label: __('Jump to')},
        ]));
        setFocusTo(this.jumpToInput);
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        unhookForm(this);
    }
    render({url, mode}) {
        return <div>
            <FormGroupInline>
                <div>{ mode === 'pick-url' ? 'Url' : 'Ulkoinen'}:</div>
                <div>{ url }</div>
            </FormGroupInline>
            { this.state.values ? <FormGroupInline>
                <label htmlFor="anchor" class="form-label">{ __('Jump to') }</label>
                <Input vm={ this } prop="anchor" placeholder={ __('e.g. ref-1') } class="tight" ref={ this.jumpToInput }/>
                <InputErrors vm={ this } prop="anchor"/>
            </FormGroupInline> : null }
        </div>;
    }
}

class PickUrlDialogO extends preact.Component {
    // currentExternalUrl;
    /**
     * @param {{mode: UrlMode; url: String|null; dialog: FloatingDialog; onConfirm: (url: String, mode: UrlMode) => void;}} props
     */
    constructor(props) {
        super(props);
        this.state = {mode: props.mode};
        this.currentExternalUrl = null;
    }
    /**
     * @access protected
     */
    componentDidMount() {
        this.props.dialog.setHeight(...getHeight(this.props.mode));
    }
    /**
     * @access protected
     */
    render({url}, {mode}) {
        if (mode === 'pick-url') return <PickPageTabO
            url={ url }
            onPickurl={ slug => this.commitAndClose(urlUtils.makeUrl(slug)) }
            goBack={ this.goBack.bind(this) }/>;
        //
        if (mode === 'pick-file') return [
            <div><button onClick={ this.goBack.bind(this) } class="btn btn-sm mb-2" type="button">&lt;</button></div>,
            <FileUploader
                mode="pick"
                onEntryClicked={ entry => { this.commitAndClose(urlUtils.makeAssetUrl(`/public/uploads${entry.baseDir}/${entry.fileName}`)); } }
                numColumns="3"
                hideUploadButton/>
        ];
        //
        if (mode === 'type-external-url') return <DefineExternalUrlTab
            url={ url }
            goBack={ this.goBack.bind(this) }
            onUrlChanged={ validUrl => {
                this.currentExternalUrl = normalizeExternalUrl(validUrl);
            } }
            done={ doCommit => doCommit ? this.commitAndClose(this.currentExternalUrl) : this.close() }/>;
        //
        return <div class="item-grid three large-buttons">{ [
            ['pick-url', 'file', __('Page')],
            ['pick-file', 'photo', `${__('Image')} / ${__('File')}`],
            ['type-external-url', 'external-link', __('External')],
        ].map(([mode, iconId, text]) =>
            <button onClick={ () => this.setMode(mode) } class="btn with-icon text-tiny" type="button" key={ mode }>
                <Icon iconId={ iconId }/>
                { text }
            </button>
        ) }</div>;
    }
    /**
     * @param {UrlMode} mode
     * @access private
     */
    setMode(mode) {
        this.props.dialog.setTitle(getLabel(mode));
        this.props.dialog.setHeight(...getHeight(mode));
        this.setState({mode});
    }
    /**
     * @param {String} url
     * @access private
     */
    commitAndClose(url) {
        this.props.onConfirm(url.slice(0, validationConstraints.HARD_SHORT_TEXT_MAX_LEN), this.state.mode);
        this.close();
    }
    /**
     * @access private
     */
    close() {
        this.props.dialog.close();
    }
    /**
     * @access private
     */
    goBack() {
        this.setMode('choose-link-type');
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
class PickPageTabO extends preact.Component {
    /**
     * @param {{url: String; onPickurl: (slug: String) => void; goBack: () => void;}} props
     */
    constructor(props) {
        super(props);
        this.state = {pages: null};
        http.get('/api/pages/Pages')
            .then(pages => {
                if (props.url) {
                    const short = props.url.substring(urlUtils.baseUrl.length - 1);
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
    render({onPickurl, goBack}, {pages, selectedIdx}) {
        return [
            <div><button onClick={ goBack } class="btn btn-sm mb-2" type="button">&lt;</button></div>,
            <input
                class="form-input mb-2"
                placeholder={ __('Filter') }
                disabled/>,
            Array.isArray(pages) ? <ul class={ `list table-list selectable-items${selectedIdx !== null ? ' has-first-item-selected' : '' }` }>{ pages.map(({title, slug}, i) =>
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
            <Input vm={ this } prop="url" placeholder={ __('website.com') } onKeyDown={ e => {
                if (e.key === 'Enter' && !this.enterPressedAt) this.enterPressedAt = Date.now();
            } } onKeyUp={ e => {
                if (!this.enterPressedAt || e.key !== 'Enter') return;
                if ((Date.now() - this.enterPressedAt) < 100) this.props.done(e !== true);
                else this.enterPressedAt = null;
            } } style="width: calc(100% - 1rem);" ref={ this.nameInput }/>,
            <InputErrors vm={ this } prop="url"/>,
            <button class="btn btn-primary btn-sm mt-2 px-2" disabled={ e } onClick={ () => done(e !== true) }>Ok</button>,
            <button class="btn btn-sm btn-link mt-2 ml-1" onClick={ () => done(false) }>{ __('Cancel') }</button>
        ];
    }
}
class DefineExternalUrlTabO extends preact.Component {
    // nameInput;
    // enterPressedAt;
    /**
     * @param {{url: String; goBack: () => void; onUrlChanged: (validUrl: String) => void; done: (doCommit: Boolean) => void; }} props
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
    render({goBack, done}) {
        const e = hasErrors(this);
        return [
            <div><button onClick={ goBack } class="btn btn-sm mb-2" type="button" disabled={ e }>&lt;</button></div>,
            <Input vm={ this } prop="url" placeholder={ __('website.com') } onKeyDown={ e => {
                if (e.key === 'Enter' && !this.enterPressedAt) this.enterPressedAt = Date.now();
            } } onKeyUp={ e => {
                if (!this.enterPressedAt || e.key !== 'Enter') return;
                if ((Date.now() - this.enterPressedAt) < 100) this.props.done(e !== true);
                else this.enterPressedAt = null;
            } } ref={ this.nameInput }/>,
            <InputErrors vm={ this } prop="url"/>,
            <button class="btn btn-primary btn-sm mt-2 px-2" disabled={ e } onClick={ () => done(e !== true) }>Ok</button>,
            <button class="btn btn-sm btn-link mt-2 ml-1" onClick={ () => done(false) }>{ __('Cancel') }</button>
        ];
    }
}

/**
 * @param {UrlMode} mode
 * @returns {[Number, String|null]} [height, instruction]
 */
function getHeight(mode, forNewPicker = false) {
    if (forNewPicker) {
    if (mode === 'pick-url')
        return [298, 'animate'];
    if (mode === 'pick-file')
        return [200, 'animate'];
    if (mode === 'type-external-url')
        return [200, 'animate'];
    return [220, null];
    }
    if (mode === 'pick-url')
        return [375, 'animate'];
    if (mode === 'pick-file')
        return [404, 'animate'];
    return [196, null];
}

/**
 * @param {String} url
 * @returns {String|null}
 */
function unnormalizeExternalUrl(url) {
    if (url.startsWith('//')) return url.substring(2);
    return url.startsWith('/') ? null : url;
}

/**
 * @typedef {'pick-url'|'pick-file'|'type-external-url'} UrlMode
 */

export default PickUrlDialog;
export {getHeight, PickUrlDialogO};
