import {__, env, http, Icon, LoadingSpinner, hookForm, Input, InputErrors, hasErrors, urlUtils} from '@sivujetti-commons-for-edit-app';
import UploadsManager from '../Upload/UploadsManager.jsx';
import {urlValidatorImpl} from '../validation.js';
import {validationConstraints} from '../constants.js';
import {determineModeFrom, getLabel} from './common.js';

class PickUrlDialog extends preact.Component {
    // currentExternalUrl;
    /**
     * @param {{mode: UrlMode; url: String|null; dialog: FloatingDialog; quill: Object;}} props
     */
    constructor(props) {
        super(props);
        this.state = {mode: props.mode};
        props.dialog.setOnBeforeClose(() => {
            if (this.state.mode === 'type-external-url' && this.currentExternalUrl) this.save(this.currentExternalUrl, false);
        });
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
        if (mode === 'pick-url') return <PickPageTab
            url={ url }
            onPickurl={ this.save.bind(this) }
            goBack={ () => this.setMode('choose-link-type') }/>;
        //
        if (mode === 'pick-image') return [
            <div><button onClick={ () => this.setMode('choose-link-type') } class="btn btn-sm mb-2" type="button">&lt;</button></div>,
            <UploadsManager
                onEntryClicked={ entry => { this.save(`${entry.baseDir}/${entry.fileName}`); } }
                numColumns="3"
                onlyImages
                hideTabs/>
        ];
        //
        if (mode === 'type-external-url') return <DefineExternalUrlTab
            url={ url }
            goBack={ () => {
                if (this.currentExternalUrl) this.save(this.currentExternalUrl, false);
                this.setMode('choose-link-type');
            } }
            onUrlChanged={ validUrl => {
                this.currentExternalUrl = validUrl;
            } }
            done={ () => this.save(this.currentExternalUrl, true) }/>;
        //
        return <div class="item-grid three large-buttons">{ [
            ['pick-url', 'file', 'Page'],
            ['pick-image', 'photo', 'Image'],
            ['type-external-url', 'external-link', 'External'],
        ].map(([mode, iconId, text]) =>
            <button onClick={ () => this.setMode(mode) } class="btn with-icon text-tiny" type="button" key={ mode }>
                <Icon iconId={ iconId }/>
                { __(text) }
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
     * @param {Boolean} close = true
     * @access private
     */
    save(url, close = true) {
        const {quill} = this.props;
        var scrollTop = quill.root.scrollTop;
        if (quill.theme.tooltip.linkRange) {
            quill.formatText(quill.theme.tooltip.linkRange, 'link', url, window.Quill.sources.USER);
            delete quill.theme.tooltip.linkRange;
        } else {
            quill.theme.tooltip.restoreFocus();
            quill.format('link', url, window.Quill.sources.USER);
        }
        quill.root.scrollTop = scrollTop;
        if (close)
            this.props.dialog.close();
    }
}

// ----

class PickPageTab extends preact.Component {
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
                class="form-input"
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
    // enterPressedAt;
    /**
     * @param {{url: String; goBack: () => void; onUrlChanged: (validUrl: String) => void; done: () => void; }} props
     */
    constructor(props) {
        super(props);
        const url = props.url && determineModeFrom(props.url)[0] === 'type-external-url' ? unnormalize(props.url) : '';
        this.componentWillMount();
        this.state = hookForm(this, [
            {name: 'url', value: url, validations: [
                [urlValidatorImpl, {allowEmpty: true, allowLocal: false}],
                ['maxLength', validationConstraints.HARD_SHORT_TEXT_MAX_LEN]
            ], label: __('Url'), onAfterValueChanged: (value, hasErrors) => { if (!hasErrors) props.onUrlChanged(value); }},
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
    render({goBack}) {
        return [
            <div><button onClick={ goBack } class="btn btn-sm mb-2" type="button" disabled={ hasErrors(this) }>&lt;</button></div>,
            <Input vm={ this } prop="url" placeholder={ __('website.com') } onKeyDown={ e => {
                if (e.key === 'Enter' && !this.enterPressedAt) this.enterPressedAt = Date.now();
            } } onKeyUp={ e => {
                if (!this.enterPressedAt || e.key !== 'Enter') return;
                if ((Date.now() - this.enterPressedAt) < 100) this.props.done();
                else this.enterPressedAt = null;
            } }/>,
            <InputErrors vm={ this } prop="url"/>
        ];
    }
}

/**
 * @param {UrlMode} mode
 * @returns {[Number, String|null]} [height, instruction]
 */
function getHeight(mode) {
    if (mode === 'pick-url')
        return [375, 'animate'];
    if (mode === 'pick-image')
        return [404, 'animate'];
    return [180, null];
}

/**
 * @param {String} url
 * @returns {String|null}
 */
function unnormalize(url) {
    if (url.startsWith('//')) return url.substring(2);
    return url.startsWith('/') ? null : url;
}

/**
 * @typedef {'pick-url'|'pick-image'|'type-external-url'} UrlMode
 */

export default PickUrlDialog;
export {getHeight};
