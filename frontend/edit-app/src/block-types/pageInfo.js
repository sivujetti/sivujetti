import {__, api, http, signals, env, hookForm, unhookForm, reHookValues, Input,
        InputErrors, FormGroupInline, Textarea} from '@sivujetti-commons-for-edit-app';
import toasters from '../commons/Toaster.jsx';
import {stringUtils} from '../commons/utils.js';
import BlockTrees from '../BlockTrees.jsx';
import {validationConstraints} from '../constants.js';
import setFocusTo from './auto-focusers.js';

const urlValidatorImpl = {doValidate: (val, hints = {}) => {
    const [allowExternal, allowEmpty] = [
        Object.prototype.hasOwnProperty.call(hints, 'allowExternal') ? hints.allowExternal : true,
        Object.prototype.hasOwnProperty.call(hints, 'allowEmpty') ? hints.allowEmpty : false,
    ];
    //
    const [comp, isLocal] = createCanonicalUrl(val);
    if (!comp)
        return !!allowEmpty;
    if (isLocal)
        return new RegExp(validationConstraints.SLUG_REGEXP).test(comp);
    // External
    if (!allowExternal)
        return false;
    try {
        const u = new URL(comp);
        if (!u.protocol || ['https:', 'http:'].indexOf(u.protocol) < 0) return false;
        if (!u.host || u.host === env.window.location.host) return false;
        return true;
    } catch (e) {
        return false;
    }
}, errorMessageTmpl: '{field} is not valid'};

class PageInfoBlockEditForm extends preact.Component {
    // titleEl;
    // descriptionEl;
    // pageType;
    /**
     * @param {RawBlockData} snapshot
     * @access public
     */
    overrideValues(snapshot) {
        reHookValues(this, [{name: 'title', value: snapshot.title},
                            {name: 'slug', value: snapshot.slug},
                            {name: 'description', value: snapshot.description}]);
    }
    /**
     * @access public
     */
    getCommitSettings() {
        return {
            opKey: 'update-page-basic-info',
            beforePushOp(a) {
                overwriteCurrentPageInfo(a.valAfter);
            },
            doHandle: !BlockTrees.currentWebPage.data.page.isPlaceholderPage
                ? (_$a, _$b) => savePageToBackend()
                : null
            ,
            onUndo($a, _$b) {
                overwriteCurrentPageInfo($a.valBefore);
            },
        };
    }
    /**
     * @access protected
     */
    componentWillMount() {
        const {snapshot, onValueChanged, onManyValuesChanged} = this.props;
        this.titleEl = preact.createRef();
        this.descriptionEl = preact.createRef();
        const currentPage = BlockTrees.currentWebPage.data.page;
        this.pageType = api.getPageTypes().find(({name}) => name === currentPage.type);
        this.setState(hookForm(this, [
            {name: 'title', value: snapshot.title, validations: [['required'], ['maxLength', 92]],
             label: __('Page title'), onAfterValueChanged: (value, hasErrors) => {
                onValueChanged(value, 'title', hasErrors, env.normalTypingDebounceMillis); }},
            {name: 'slug', value: snapshot.slug, validations: [['required'], ['maxLength', 92], [urlValidatorImpl, {allowExternal: false, allowEmpty: true}]],
             label: __('Url (slug)'), onAfterValueChanged: (value, hasErrors) => {
                 onManyValuesChanged({slug: value, path: makePath(value, this.pageType)}, hasErrors, env.normalTypingDebounceMillis); }},
            {name: 'description', value: snapshot.description, validations: [['maxLength', 206]],
             label: __('Meta description'), onAfterValueChanged: (value, hasErrors) => {
                onValueChanged(value, 'description', hasErrors, env.normalTypingDebounceMillis); }},
        ]));
    }
    /**
     * @access protected
     */
    componentDidMount() {
        setFocusTo(this.titleEl);
        window.autosize(this.descriptionEl.current.inputEl.current);
        signals.emit('on-page-info-form-value-changed', snapshotToPageMeta(this.props.snapshot), true);
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        unhookForm(this);
    }
    /**
     * @param {BlockEditFormProps} props
     * @access protected
     */
    render() {
        if (!this.state.values) return;
        const wrap = input => this.pageType.name === 'Pages'
            ? input
            : <div class="input-group">
                <span class="input-group-addon addon-sm">{ this.pageType.slug }</span>
                { input }
            </div>;
        return <div class="form-horizontal pt-0">
            <FormGroupInline>
                <label htmlFor="title" class="form-label">{ __('Page title') }</label>
                <Input vm={ this } prop="title" ref={ this.titleEl }/>
                <InputErrors vm={ this } prop="title"/>
            </FormGroupInline>
            <FormGroupInline>
                <label htmlFor="slug" class="form-label">{ __('Url (slug)') }</label>
                { wrap(<Input vm={ this } prop="slug"/>) }
                <InputErrors vm={ this } prop="slug"/>
            </FormGroupInline>
            <FormGroupInline>
                <label htmlFor="description" class="form-label">{ __('Meta description') }</label>
                <Textarea vm={ this } prop="description" ref={ this.descriptionEl }/>
                <InputErrors vm={ this } prop="description"/>
            </FormGroupInline>
        </div>;
    }
}

/**
 * @returns {Promise<Boolean>}
 */
function savePageToBackend() {
    const currentPage = BlockTrees.currentWebPage.data.page;
    const data = Object.assign({}, currentPage);
    delete data.blocks;
    delete data.isPlaceholderPage;
    //
    return http.put(`/api/pages/${currentPage.type}/${currentPage.id}`, data)
        .then(resp => {
            if (resp.ok !== 'ok') throw new Error('-');
            return true;
        })
        .catch(err => {
            window.console.error(err);
            toasters.editAppMain(__('Something unexpected happened.'), 'error');
            return false;
        });
}

/**
 * @param {Object} state
 */
function overwriteCurrentPageInfo(state) {
    const newData = snapshotToPageMeta(state);
    Object.assign(BlockTrees.currentWebPage.data.page, newData); // Note: Mutates BlockTrees.currentWebPage.data.page
    signals.emit('on-page-info-form-value-changed', newData, false);
}

/**
 * @param {String} title
 * @returns {String}
 */
function makeSlug(title) {
    return `/${stringUtils.slugify(title) || '-'}`;
}

/**
 * @param {String} slug e.g. "/my-page"
 * @param {PageType} pageType
 * @returns {String} e.g. "my-page/", "articles/my-article/"
 */
function makePath(slug, pageType) {
    return `${((pageType.name === 'Pages' ? '' : pageType.slug) + slug).substring(1)}/`;
}

/**
 * @param {Page|Object} from
 * @param {PageType} pageType
 * @returns {PageInfoSnapshot}
 */
function createPageData(from, pageType) {
    const out = {title: from.title,
                 slug: from.slug,
                 description: from.meta.description || '',
                 path: from.path};
    for (const field of pageType.ownFields) {
        if (field.dataType.type === 'many-to-many') {
            out[field.name] = '[]';
            continue;
        }
        const val = from[field.name];
        out[field.name] = val !== null ? val : field.defaultValue;
    }
    return out;
}

/**
 * @param {PageInfoSnapshot} snapshot
 * @returns {PageMetaRaw}
 */
function snapshotToPageMeta(snapshot) {
    const toPageData = Object.assign({meta: {description: snapshot.description}}, snapshot);
    delete toPageData.description;
    return toPageData;
}

export default () => {
    const initialData = {overrides: '[]'};
    return {
        name: 'PageInfo',
        friendlyName: 'PageInfo',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        icon: 'file-info',
        reRender: () => '', // Do nothing
        createSnapshot: () => {
            const currentPage = BlockTrees.currentWebPage.data.page;
            const pageType = api.getPageTypes()
                .find(({name}) => name === currentPage.type);
            //
            const out = createPageData(currentPage, pageType);
            if (currentPage.isPlaceholderPage && out.slug === '-') {
                out.slug = makeSlug(out.title);
                out.path = makePath(out.slug, pageType);
                currentPage.slug = out.slug; // Note: Mutates BlockTrees.currentWebPage.data.page
            }
            return out;
        },
        editForm: PageInfoBlockEditForm,
    };
};

/**
 * @param {String} input
 * @returns {String}
 */
function createCanonicalUrl(input) {
    if (!input.length)
        return '';
    if (input.indexOf('.') < 0) { // treat as local
        return [input.startsWith('/') ? input : `/${input}`, true];
    } else { // treat as external
        return [input.startsWith('http://') || input.startsWith('https://') ? input : `https://${input}`, false];
    }
}

/**
 * @typedef PageInfoSnapshot
 *
 * @prop {String} title
 * @prop {String} slug
 * @prop {String} path
 * @prop {String} description
 * ... possibly more props (Own fields)
 */

export {savePageToBackend, urlValidatorImpl};
