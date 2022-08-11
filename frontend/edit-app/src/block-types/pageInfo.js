import {__, api, http, signals, env, hookForm, unhookForm, reHookValues, Input,
        InputErrors, FormGroupInline, FormGroup, Textarea} from '@sivujetti-commons-for-edit-app';
import toasters from '../commons/Toaster.jsx';
import {stringUtils} from '../commons/utils.js';
import ManyToManyField from '../Page/ManyToManyField.jsx';
import BlockTrees from '../BlockTrees.jsx';
import store, {observeStore, pushItemToOpQueue, selectCurrentPageDataBundle, setCurrentPageDataBundle} from '../store.js';
import setFocusTo from './auto-focusers.js';
import {urlValidatorImpl} from '../validation.js';

const featureFlagConditionUseReduxBlockTree = window.useReduxBlockTree;

class PageInfoBlockEditForm2 extends preact.Component {
    // currentPageIsPlaceholder;
    // pageType;
    // ownFields;
    // titleEl;
    // descriptionEl;
    /**
     * @access protected
     */
    componentWillMount() {
        const curPage = selectCurrentPageDataBundle(store.getState()).page;
        this.currentPageIsPlaceholder = curPage.isPlaceholderPage;
        this.pageType = api.getPageTypes().find(({name}) => name === curPage.type);
        this.ownFields = this.pageType.ownFields.filter(({dataType}) => dataType.type === 'many-to-many');
        this.titleEl = preact.createRef();
        this.descriptionEl = preact.createRef();
        const createSlugAndPath = slug => ({slug, path: makePath(slug, this.pageType)});
        const createSlugAndPathFromTitle = !this.currentPageIsPlaceholder
            ? (_ => ({}))
            : createSlugAndPath;
        this.setState(hookForm(this, [
            {name: 'title', value: curPage.title, validations: [['required'], ['maxLength', 92]],
             label: __('Page title'), onAfterValueChanged: (value, hasErrors) => {
                if (!hasErrors) this.emitChanges(mut => {
                    Object.assign(
                        mut,
                        {title: value},
                        createSlugAndPathFromTitle(makeSlug(value)),
                    );
                });
            }},
            {name: 'slug', value: curPage.slug, validations: [['required'], ['maxLength', 92],
                [urlValidatorImpl, {allowExternal: false, allowEmpty: true}]],
             label: __('Url (slug)'), onAfterValueChanged: (value, hasErrors) => {
                if (!hasErrors) this.emitChanges(mut => { Object.assign(
                    mut,
                    createSlugAndPath(value),
                ); });
            }},
            {name: 'description', value: curPage.meta.description, validations: [['maxLength', 206]],
             label: __('Meta description'), onAfterValueChanged: (value, hasErrors) => {
                if (!hasErrors) this.emitChanges(mut => { mut.meta.description = value; });
             }},
        ]));
        observeStore(selectCurrentPageDataBundle, ({page}) => {
            if (this.state.values.title !== page.title ||
                this.state.values.slug !== page.slug ||
                this.state.values.description !== page.meta.description) {
                reHookValues(this, [{name: 'title', value: page.title},
                                    {name: 'slug', value: page.slug},
                                    {name: 'description', value: page.meta.description || ''}]);
            }
        });
    }
    /**
     * @access protected
     */
    componentDidMount() {
        setFocusTo(this.titleEl);
        window.autosize(this.descriptionEl.current.inputEl.current);
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
    render() {
        const wrap = input => !this.pageType || this.pageType.name === 'Pages'
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
            <FormGroup>
                <label htmlFor="description" class="form-label">{ __('Meta description') }</label>
                <Textarea vm={ this } prop="description" ref={ this.descriptionEl }/>
                <InputErrors vm={ this } prop="description"/>
            </FormGroup>
            { this.ownFields ? this.ownFields.map(field =>
                <ManyToManyField
                    field={ field }
                    emitChanges={ this.emitChanges.bind(this) }
                    key={ field.name }/>
            ) : null }
        </div>;
    }
    /**
     * @param {(pageToMutate: Page) => void} mutateProps
     */
    emitChanges(mutateProps) {
        const mut = selectCurrentPageDataBundle(store.getState());
        const orig = JSON.parse(JSON.stringify(mut));
        //
        mutateProps(mut.page);
        store.dispatch(setCurrentPageDataBundle(mut));
        //
        store.dispatch(pushItemToOpQueue('update-page-basic-info', {
            doHandle: !this.currentPageIsPlaceholder ? savePageToBackend : null,
            doUndo: () => {
                store.dispatch(setCurrentPageDataBundle(orig));
            },
            args: [],
        }));
    }
}

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
    let data;
    if (!featureFlagConditionUseReduxBlockTree) {
    data = Object.assign({}, BlockTrees.currentWebPage.data.page);
    } else {
    data = Object.assign({}, selectCurrentPageDataBundle(store.getState()).page);
    }
    delete data.blocks;
    delete data.isPlaceholderPage;
    //
    return http.put(`/api/pages/${data.type}/${data.id}`, data)
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
            if (featureFlagConditionUseReduxBlockTree) return {};
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
        editForm: !featureFlagConditionUseReduxBlockTree ? PageInfoBlockEditForm : PageInfoBlockEditForm2,
    };
};

/**
 * @typedef PageInfoSnapshot
 *
 * @prop {String} title
 * @prop {String} slug
 * @prop {String} path
 * @prop {String} description
 * ... possibly more props (Own fields)
 */

export {savePageToBackend, makeSlug, makePath};
