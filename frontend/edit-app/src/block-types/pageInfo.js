import {__, api, http, stringUtils, hookForm, unhookForm, reHookValues, Input,
    InputErrors, FormGroupInline, FormGroup, Textarea} from '@sivujetti-commons-for-edit-app';
import toasters from '../commons/Toaster.jsx';
import ManyToManyField from '../Page/ManyToManyField.jsx';
import store, {observeStore, pushItemToOpQueue, selectCurrentPageDataBundle, setCurrentPageDataBundle} from '../store.js';
import setFocusTo from './auto-focusers.js';
import {urlValidatorImpl} from '../validation.js';

class PageInfoBlockEditForm extends preact.Component {
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

/**
 * @returns {Promise<Boolean>}
 */
function savePageToBackend() {
    let data;
    data = Object.assign({}, selectCurrentPageDataBundle(store.getState()).page);
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
        createSnapshot: () => ({}),
        editForm: PageInfoBlockEditForm,
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
