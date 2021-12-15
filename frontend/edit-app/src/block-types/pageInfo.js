import {__, http, signals, env} from '../commons/main.js';
import {useField, FormGroupInline, InputErrors} from '../commons/Form2.jsx';
import toasters from '../commons/Toaster.jsx';
import {stringUtils} from '../commons/utils.js';
import BlockTrees from '../BlockTrees.jsx';
import setFocusTo from './auto-focusers.js';

/**
 * @type {preact.FunctionalComponent<BlockEditFormProps>}
 */
const PageInfoBlockEditForm = ({snapshot, funcsIn, funcsOut}) => {
    const title = useField('title', {value: snapshot.title, validations: [['required'], ['maxLength', 92]],
        label: __('Page title'),
        onAfterValidation: (val, hasErrors) => {
            BlockTrees.currentWebPage.updateTitle(val);
            funcsIn.onValueChanged(val, 'title', hasErrors, env.normalTypingDebounceMillis);
        }});
    const titleEl = preactHooks.useMemo(() => preact.createRef(), []);
    const slug = useField('slug', {value: snapshot.slug, validations: [['required'], ['maxLength', 92], ['regexp', '^/[a-zA-Z0-9_\\-$.+!*\'():,]*$', __(' contains forbidden characters')]],
        label: __('Url (slug)'),
        onAfterValidation: (val, hasErrors) => { funcsIn.onValueChanged(val, 'slug', hasErrors, env.normalTypingDebounceMillis); }});
    //
    preactHooks.useEffect(() => {
        setFocusTo(titleEl);
    }, []);
    //
    funcsOut.commitOverrides = preactHooks.useMemo(() => ({
        opKey: 'update-page-basic-info',
        beforePushOp: (newValue) => { overwriteCurrentPageInfo(newValue); },
        doHandle: savePageToBackend,
        onUndo: (oldValue) => { overwriteCurrentPageInfo(oldValue); },
    }), []);
    funcsOut.resetValues = preactHooks.useCallback((newValue) => {
        title.triggerInput(newValue.title);
        slug.triggerInput(newValue.slug);
    }, []);
    //
    return <div class="form-horizontal pt-0">
        <FormGroupInline>
            <label htmlFor="title" class="form-label">{ __('Page title') }</label>
            <input { ...title } ref={ titleEl }/>
            <InputErrors errors={ title.getErrors() }/>
        </FormGroupInline>
        <FormGroupInline>
            <label htmlFor="slug" class="form-label">{ __('Url (slug)') }</label>
            <input { ...slug }/>
            <InputErrors errors={ slug.getErrors() }/>
        </FormGroupInline>
    </div>;
};

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
    signals.emit('on-page-info-form-value-changed', titleSlugAndOwnFields);
}

/**
 * @param {String} title
 * @returns {String}
 */
function makeSlug(title) {
    return `/${stringUtils.slugify(title) || '-'}`;
}

/**
 * @param {Page|Object} from
 * @param {PageType} pageType
 * @return {PageMetaRaw}
 */
function createPageData(from, pageType) {
    const out = {title: from.title, slug: from.slug};
    for (const field of pageType.ownFields) {
        if (field.dataType === 'many-to-many') {
            out[field.name] = '[]';
            continue;
        }
        const val = from[field.name];
        out[field.name] = val !== null ? val : field.defaultValue;
    }
    return out;
}

/**
 * @param {InternalSivujettiApi} internalSivujettiApi
 */
export default internalSivujettiApi => {
    const initialData = {overrides: '[]'};
    PageInfoBlockEditForm.internalSivujettiApi = internalSivujettiApi;
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
            const pageType = PageInfoBlockEditForm.internalSivujettiApi.getPageTypes()
                .find(({name}) => name === currentPage.type);
            //
            const out = createPageData(currentPage, pageType);
            if (currentPage.isPlaceholderPage && out.slug === '-') {
                out.slug = makeSlug(out.title);
                currentPage.slug = out.slug; // Note: Mutates BlockTrees.currentWebPage.data.page
            }
            return out;
        },
        editForm: PageInfoBlockEditForm,
    };
};
