import {__, api, http, signals, env, hookForm, unhookForm, reHookValues, Input, InputErrors, FormGroupInline} from '@sivujetti-commons-for-edit-app';
import toasters from '../commons/Toaster.jsx';
import {stringUtils} from '../commons/utils.js';
import BlockTrees from '../BlockTrees.jsx';
import setFocusTo from './auto-focusers.js';

class PageInfoBlockEditForm extends preact.Component {
    // titleEl;
    // pageType;
    /**
     * @param {RawBlockData} snapshot
     * @access public
     */
    overrideValues(snapshot) {
        reHookValues(this, [{name: 'title', value: snapshot.title},
                            {name: 'slug', value: snapshot.slug}]);
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
                ? ($a, _$b) => savePageToBackend($a.valAfter)
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
        const currentPage = BlockTrees.currentWebPage.data.page;
        this.pageType = api.getPageTypes().find(({name}) => name === currentPage.type);
        this.setState(hookForm(this, [
            {name: 'title', value: snapshot.title, validations: [['required'], ['maxLength', 92]],
             label: __('Page title'), onAfterValueChanged: (value, hasErrors) => {
                onValueChanged(value, 'title', hasErrors, env.normalTypingDebounceMillis); }},
            {name: 'slug', value: snapshot.slug, validations: [['required'], ['maxLength', 92], ['regexp', '^/[a-zA-Z0-9_\\-$.+!*\'():,]*$']],
             label: __('Url (slug)'), onAfterValueChanged: (value, hasErrors) => {
                 onManyValuesChanged({slug: value, path: makePath(value, this.pageType)}, hasErrors, env.normalTypingDebounceMillis); }},
        ], {
            takeFullWidth: snapshot.takeFullWidth,
        }));
    }
    /**
     * @access protected
     */
    componentDidMount() {
        setFocusTo(this.titleEl);
        signals.emit('on-page-info-form-value-changed', this.props.snapshot, true);
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
        </div>;
    }
    /**
     * @param {Event} e
     * @access private
     */
    emitSetFullWidth(e) {
        const takeFullWidth = e.target.checked ? 1 : 0;
        this.setState({takeFullWidth});
        this.props.onValueChanged(takeFullWidth, 'takeFullWidth');
    }
}

/**
 * @param {RawBlockData} snapshot
 * @returns {Promise<Boolean>}
 */
function savePageToBackend(snapshot) {
    const currentPage = BlockTrees.currentWebPage.data.page;
    const data = Object.assign({}, currentPage, snapshot);
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
 * @param {PageMetaRaw} titleSlugAndOwnFields
 */
function overwriteCurrentPageInfo(titleSlugAndOwnFields) {
    Object.assign(BlockTrees.currentWebPage.data.page, titleSlugAndOwnFields); // Note: Mutates BlockTrees.currentWebPage.data.page
    signals.emit('on-page-info-form-value-changed', titleSlugAndOwnFields, false);
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
 * @return {PageMetaRaw}
 */
function createPageData(from, pageType) {
    const out = {title: from.title, slug: from.slug, path: from.path};
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

export {savePageToBackend};
